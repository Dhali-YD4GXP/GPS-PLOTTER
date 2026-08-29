package main

import (
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/xuri/excelize/v2"
)

var jwtKey = []byte("super-secret-gps-key")

type MenteeToken struct {
	Token         string    `json:"token"`
	ResearchTitle string    `json:"research_title"`
	SchoolName    string    `json:"school_name"`
	MenteeName    string    `json:"mentee_name"`
	CreatedAt     time.Time `json:"created_at"`
	ExpiresAt     time.Time `json:"expires_at"`
	IsActive      bool      `json:"is_active"`
}

var (
	menteeTokens map[string]MenteeToken
	dbMutex      sync.Mutex
)

const dbFile = "tokens.json"

func initDB() {
	menteeTokens = make(map[string]MenteeToken)
	data, err := os.ReadFile(dbFile)
	if err == nil {
		json.Unmarshal(data, &menteeTokens)
	}
}

func saveDB() {
	data, _ := json.MarshalIndent(menteeTokens, "", "  ")
	os.WriteFile(dbFile, data, 0644)
}

const R = 6371000.0 // Earth radius in meters

func toRadians(deg float64) float64 {
	return deg * math.Pi / 180.0
}

func haversine(lat1, lon1, lat2, lon2 float64) float64 {
	phi1 := toRadians(lat1)
	phi2 := toRadians(lat2)
	deltaPhi := toRadians(lat2 - lat1)
	deltaLambda := toRadians(lon2 - lon1)

	a := math.Pow(math.Sin(deltaPhi/2.0), 2) +
		math.Cos(phi1)*math.Cos(phi2)*math.Pow(math.Sin(deltaLambda/2.0), 2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return R * c
}

func gpsToCartesian(latRef, lonRef, lat, lon float64) (float64, float64) {
	x := haversine(latRef, lonRef, latRef, lon)
	if lon < lonRef {
		x = -x
	}

	y := haversine(latRef, lonRef, lat, lonRef)
	if lat < latRef {
		y = -y
	}

	return x, y
}

func adminLogin(c *gin.Context) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if req.Username == "admin" && req.Password == "admin123" {
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"role": "admin",
			"exp":  time.Now().Add(24 * time.Hour).Unix(),
		})
		tokenString, _ := token.SignedString(jwtKey)
		c.JSON(http.StatusOK, gin.H{"token": tokenString})
		return
	}
	c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
}

func generateMenteeToken(c *gin.Context) {
	var req struct {
		TokenCode      string `json:"token_code"`
		ResearchTitle  string `json:"research_title"`
		SchoolName     string `json:"school_name"`
		MenteeName     string `json:"mentee_name"`
		DurationMonths int    `json:"duration_months"` // 1, 2, 3, 4, 5, 12
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if req.TokenCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kode token tidak boleh kosong"})
		return
	}

	exp := time.Now().AddDate(0, req.DurationMonths, 0)

	dbMutex.Lock()
	if _, exists := menteeTokens[req.TokenCode]; exists {
		dbMutex.Unlock()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kode token sudah ada, silakan gunakan kode lain"})
		return
	}

	menteeTokens[req.TokenCode] = MenteeToken{
		Token:         req.TokenCode,
		ResearchTitle: req.ResearchTitle,
		SchoolName:    req.SchoolName,
		MenteeName:    req.MenteeName,
		CreatedAt:     time.Now(),
		ExpiresAt:     exp,
		IsActive:      true,
	}
	saveDB()
	dbMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"message": "Token generated", "token": menteeTokens[req.TokenCode]})
}

func deactivateToken(c *gin.Context) {
	var req struct {
		Token string `json:"token"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	dbMutex.Lock()
	if tk, exists := menteeTokens[req.Token]; exists {
		tk.IsActive = false
		menteeTokens[req.Token] = tk
		saveDB()
		dbMutex.Unlock()
		c.JSON(http.StatusOK, gin.H{"message": "Token berhasil dinonaktifkan"})
		return
	}
	dbMutex.Unlock()
	c.JSON(http.StatusNotFound, gin.H{"error": "Token tidak ditemukan"})
}

func getTokens(c *gin.Context) {
	c.JSON(http.StatusOK, menteeTokens)
}

func menteeLogin(c *gin.Context) {
	var req struct {
		Token string `json:"token"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	dbMutex.Lock()
	tk, exists := menteeTokens[req.Token]
	dbMutex.Unlock()

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak ditemukan"})
		return
	}
	if !tk.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token ini sudah dinonaktifkan oleh Admin"})
		return
	}
	if time.Now().After(tk.ExpiresAt) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token ini sudah kadaluarsa"})
		return
	}

	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"role": "user",
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
	})
	tokenString, _ := jwtToken.SignedString(jwtKey)
	c.JSON(http.StatusOK, gin.H{"token": tokenString})
}

func authMiddleware(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing token"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token format"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid claims"})
			c.Abort()
			return
		}

		role := claims["role"].(string)
		if requiredRole != "" && role != requiredRole && role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func processGpsData(c *gin.Context) {
	latRefStr := c.PostForm("lat_ref")
	lonRefStr := c.PostForm("lon_ref")
	latRef, _ := strconv.ParseFloat(latRefStr, 64)
	lonRef, _ := strconv.ParseFloat(lonRefStr, 64)

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}

	filename := file.Filename
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not open file"})
		return
	}
	defer src.Close()

	var lats, lons []float64

	if strings.HasSuffix(filename, ".txt") {
		content, _ := io.ReadAll(src)
		lines := strings.Split(string(content), "\n")
		for _, line := range lines {
			if strings.Contains(line, "GPS  :") || strings.Contains(line, "GPS :") {
				parts := strings.Split(line, "GPS")
				if len(parts) > 1 {
					clean := strings.ReplaceAll(parts[1], ":", "")
					clean = strings.TrimSpace(clean)
					coords := strings.Split(clean, ",")
					if len(coords) == 2 {
						lat, err1 := strconv.ParseFloat(strings.TrimSpace(coords[0]), 64)
						lon, err2 := strconv.ParseFloat(strings.TrimSpace(coords[1]), 64)
						if err1 == nil && err2 == nil {
							lats = append(lats, lat)
							lons = append(lons, lon)
						}
					}
				}
			}
		}
	} else if strings.HasSuffix(filename, ".xlsx") {
		f, err := excelize.OpenReader(src)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid Excel file"})
			return
		}
		defer f.Close()
		
		sheets := f.GetSheetList()
		if len(sheets) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Excel is empty"})
			return
		}
		rows, err := f.GetRows(sheets[0])
		if err != nil || len(rows) < 2 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No data in Excel"})
			return
		}

		latCol, lonCol := -1, -1
		for i, header := range rows[0] {
			h := strings.ToLower(strings.TrimSpace(header))
			if h == "latitude" {
				latCol = i
			} else if h == "longitude" {
				lonCol = i
			}
		}

		if latCol == -1 || lonCol == -1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Header 'latitude' and 'longitude' not found"})
			return
		}

		for _, row := range rows[1:] {
			if len(row) > latCol && len(row) > lonCol {
				lat, _ := strconv.ParseFloat(row[latCol], 64)
				lon, _ := strconv.ParseFloat(row[lonCol], 64)
				if lat != 0 || lon != 0 {
					lats = append(lats, lat)
					lons = append(lons, lon)
				}
			}
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported file format. Use .txt or .xlsx"})
		return
	}

	if len(lats) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No valid GPS data found"})
		return
	}

	type Point struct {
		X float64 `json:"x"`
		Y float64 `json:"y"`
	}
	
	var points []Point
	var totalDistance float64

	for i := 0; i < len(lats); i++ {
		dist := haversine(latRef, lonRef, lats[i], lons[i])
		totalDistance += dist
		x, y := gpsToCartesian(latRef, lonRef, lats[i], lons[i])
		points = append(points, Point{X: x, Y: y})
	}

	meanDistance := totalDistance / float64(len(lats))

	c.JSON(http.StatusOK, gin.H{
		"points":        points,
		"mean_distance": meanDistance,
		"lat_ref":       latRef,
		"lon_ref":       lonRef,
	})
}

func main() {
	initDB()
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // Allows any origin, including bengkelinovasi-gpsplotter.my.id
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")
	
	api.POST("/admin/login", adminLogin)
	api.POST("/auth/login", menteeLogin)

	admin := api.Group("/admin")
	admin.Use(authMiddleware("admin"))
	{
		admin.POST("/tokens", generateMenteeToken)
		admin.GET("/tokens", getTokens)
		admin.POST("/tokens/deactivate", deactivateToken)
	}

	gps := api.Group("/gps")
	gps.Use(authMiddleware("user"))
	{
		gps.POST("/process", processGpsData)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Println("Server running on port " + port)
	r.Run(":" + port)
}
