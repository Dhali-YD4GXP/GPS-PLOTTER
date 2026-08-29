import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import tkinter as tk
from tkinter import filedialog

def haversine(lat1, lon1, lat2, lon2):
    """
    Menghitung jarak absolut (dalam meter) antara dua titik koordinat GPS
    menggunakan formula Haversine.
    """
    R = 6371000  # Jari-jari bumi rata-rata dalam meter
    
    # Konversi derajat ke radian
    phi1 = np.radians(lat1)
    phi2 = np.radians(lat2)
    delta_phi = np.radians(lat2 - lat1)
    delta_lambda = np.radians(lon2 - lon1)
    
    # Formula Haversine
    a = np.sin(delta_phi / 2.0) ** 2 + \
        np.cos(phi1) * np.cos(phi2) * \
        np.sin(delta_lambda / 2.0) ** 2
    
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    
    distance = R * c
    return distance

def gps_to_cartesian(lat_ref, lon_ref, lat, lon):
    """
    Mengkonversi koordinat GPS ke koordinat Kartesian (x, y) dalam meter
    relatif terhadap titik acuan. 
    (0,0) akan mewakili (lat_ref, lon_ref).
    """
    # Deviasi longitude pada bidang horizontal (sumbu x)
    x = haversine(lat_ref, lon_ref, lat_ref, lon)
    x = np.where(lon >= lon_ref, x, -x)  # Kanan jika > lon_ref, kiri jika < lon_ref
    
    # Deviasi latitude pada bidang vertikal (sumbu y)
    y = haversine(lat_ref, lon_ref, lat, lon_ref)
    y = np.where(lat >= lat_ref, y, -y)  # Atas jika > lat_ref, bawah jika < lat_ref
    
    return x, y

def main():
    print("="*60)
    print("      PROGRAM VISUALISASI AKURASI SENSOR GPS")
    print("="*60)
    
    # =========================================================================
    # PARAMETER INPUT INTERAKTIF
    # =========================================================================
    
    # 1. Pilih File menggunakan File Explorer
    print("Silakan pilih file data GPS (Excel / TXT) melalui jendela File Explorer yang muncul...")
    root = tk.Tk()
    root.withdraw() # Menyembunyikan jendela utama tkinter
    root.attributes('-topmost', True) # Memaksa jendela dialog muncul paling depan
    
    FILE_NAME = filedialog.askopenfilename(
        title="Pilih File Data GPS (.xlsx / .txt)",
        filetypes=[("Data Files", "*.xlsx *.txt"), ("Excel Files", "*.xlsx"), ("Text Files", "*.txt"), ("All Files", "*.*")]
    )
    
    if not FILE_NAME:
        print("\n[BATAL] Anda tidak memilih file apa pun. Program dihentikan.")
        return
    
    print(f"File terpilih: {FILE_NAME}\n")
    
    # 2. Input Titik Acuan (Latitude & Longitude)
    try:
        lat_input = input("Masukkan Latitude Acuan (misal: -6.200000): ")
        LAT_REF = float(lat_input)
        
        lon_input = input("Masukkan Longitude Acuan (misal: 106.816666): ")
        LON_REF = float(lon_input)
    except ValueError:
        print("\n[ERROR] Format koordinat harus berupa angka. Silakan jalankan ulang program.")
        return
    
    # 3. Input Judul Plot
    title_input = input("Masukkan Judul Plot (Enter untuk default): ")
    PLOT_TITLE = title_input.strip() if title_input.strip() else "Visualisasi Tingkat Akurasi Sensor GPS"
    
    print("\nMemproses data, harap tunggu...")
    print("="*60)
    # =========================================================================

    try:
        # Mengecek format file
        if FILE_NAME.endswith('.txt'):
            # Membaca data dari file log .txt
            lats_list = []
            lons_list = []
            with open(FILE_NAME, 'r') as file:
                for line in file:
                    if "GPS  :" in line or "GPS :" in line:
                        # Contoh format baris: "00:57:57.063 GPS  : -7.800572, 110.352684"
                        try:
                            # Memisahkan string berdasarkan keyword "GPS" dan mengambil bagian kanan
                            parts = line.split("GPS")[1].replace(":", "").strip()
                            lat_str, lon_str = parts.split(",")
                            lats_list.append(float(lat_str.strip()))
                            lons_list.append(float(lon_str.strip()))
                        except Exception:
                            continue
            
            if not lats_list:
                print(f"\n[ERROR] Tidak ditemukan data 'GPS' dalam file {FILE_NAME}.")
                return
                
            lats = np.array(lats_list)
            lons = np.array(lons_list)
        else:
            # Membaca data dari Excel menggunakan pandas
            df = pd.read_excel(FILE_NAME)
            
            # Mengubah semua nama header kolom menjadi huruf kecil (lowercase)
            df.columns = df.columns.str.lower()
            
            # Mengecek keberadaan kolom latitude dan longitude
            if 'latitude' not in df.columns or 'longitude' not in df.columns:
                print(f"\n[ERROR] Kolom 'latitude' atau 'longitude' tidak ditemukan pada {FILE_NAME}.")
                print("Pastikan header tabel di Excel Anda memiliki nama 'Latitude' dan 'Longitude'.")
                return
    
            # Mengekstrak array nilai
            lats = df['latitude'].values
            lons = df['longitude'].values
        
        # Menghitung jarak absolut menggunakan Haversine dari titik acuan (0,0)
        distances = haversine(LAT_REF, LON_REF, lats, lons)
        
        # Menghitung Rata-rata Jarak (Rerata Simpangan)
        mean_distance = np.mean(distances)
        
        # Konversi ke koordinat Kartesian (x, y) dalam meter
        x, y = gps_to_cartesian(LAT_REF, LON_REF, lats, lons)
        
        # =====================================================================
        # VISUALISASI DATA (Cartesian Plot)
        # =====================================================================
        plt.figure(figsize=(9, 9))
        
        # a. Titik Data GPS (scatter plot merah bulat)
        plt.scatter(x, y, color='red', marker='o', alpha=0.7, label='Titik GPS')
        
        # b. Titik Acuan (0,0) digambar sebagai silang merah (x)
        plt.scatter(0, 0, color='red', marker='x', s=150, linewidths=2.5, label='Koordinat Pembanding')
        
        # c. Lingkaran Rata-rata Akurasi (dashed, darkgoldenrod/kuning kecoklatan)
        circle = plt.Circle((0, 0), mean_distance, color='darkgoldenrod', 
                            fill=False, linestyle='--', linewidth=2, label='Lingkaran Rata-rata')
        plt.gca().add_patch(circle)
        
        # d. Teks Anotasi radius
        # Ditempatkan di sudut kanan atas garis lingkaran agar mudah dibaca
        annot_x = mean_distance * np.cos(np.pi / 4)
        annot_y = mean_distance * np.sin(np.pi / 4)
        plt.text(annot_x, annot_y, f" Rerata Simpangan = {mean_distance:.2f} meter", 
                 color='darkgoldenrod', fontsize=11, fontweight='bold',
                 verticalalignment='bottom', horizontalalignment='left')
        
        # e. Elemen Grafis Tambahan
        plt.xlabel('longitude (meter)', fontsize=11)
        plt.ylabel('latitude (meter)', fontsize=11)
        plt.title(PLOT_TITLE, pad=20, fontsize=14, fontweight='bold')
        
        # Garis bantu (grid)
        plt.grid(True, linestyle=':', alpha=0.7)
        
        # Garis sumbu utama (x=0, y=0)
        plt.axhline(0, color='black', linewidth=1.2)
        plt.axvline(0, color='black', linewidth=1.2)
        
        # Set rasio aspek x dan y sama (agar lingkaran tidak menjadi elips)
        plt.axis('equal')
        
        # Legenda di sudut kiri bawah
        plt.legend(loc='lower left', framealpha=1.0)
        
        print("\n[BERHASIL] Menampilkan plot kartesian...")
        
        # Tampilkan plot
        plt.tight_layout()
        plt.show()

    except FileNotFoundError:
        print(f"\n[ERROR] File '{FILE_NAME}' tidak ditemukan.")
        print("Pastikan Anda sudah mengetik nama file beserta formatnya (contoh: data_ku.xlsx)")
        print("serta memastikan file tersebut berada pada direktori yang sama dengan skrip ini.")
    except Exception as e:
        print(f"\n[ERROR] Terjadi kesalahan: {e}")

if __name__ == "__main__":
    main()
