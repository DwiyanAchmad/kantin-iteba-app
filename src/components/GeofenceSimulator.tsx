import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Compass, AlertCircle, Info, QrCode, ClipboardCheck } from 'lucide-react';
import { RestaurantConfig } from '../types.js';

interface GeofenceSimulatorProps {
  config: RestaurantConfig;
  userLat: number;
  userLng: number;
  onLocationChange: (lat: number, lng: number, simulatedName: string) => void;
  scannedTable: string | null;
  onScanTable: (tableNo: string | null) => void;
}

export default function GeofenceSimulator({
  config,
  userLat,
  userLng,
  onLocationChange,
  scannedTable,
  onScanTable
}: GeofenceSimulatorProps) {
  const [distance, setDistance] = useState<number>(0);
  const [showQRMenu, setShowQRMenu] = useState(false);

  // Quick preset locations
  const presets = [
    { name: 'Meja 03 (Dalam Kedai)', lat: -6.19522, lng: 106.82081, desc: 'Sangat dekat (~3 meter)', range: 'inside' },
    { name: 'Teras Luar (Patio)', lat: -6.19532, lng: 106.82105, desc: 'Di area makan patio (~30 meter)', range: 'inside' },
    { name: 'Halte Bundaran HI', lat: -6.19630, lng: 106.82180, desc: 'Di seberang jalan (~160 meter)', range: 'outside' },
    { name: 'Monas (Jakarta)', lat: -6.17540, lng: 106.82710, desc: 'Sangat jauh (~2.3 kilometer)', range: 'outside' }
  ];

  // Table QR Presets for simulator scanning
  const qrs = [
    { tableNo: 'T-01', desc: 'Meja Sofa Tengah (Dekat Kasir)' },
    { tableNo: 'T-04', desc: 'Meja Bar Depan (Single Seat)' },
    { tableNo: 'T-07', desc: 'Meja Keluarga (Lantai 2)' },
    { tableNo: 'T-10', desc: 'Meja Outdoor Hangout (Patio)' }
  ];

  // Haversine formula
  const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  useEffect(() => {
    const dist = getDistanceMeters(userLat, userLng, config.latitude, config.longitude);
    setDistance(dist);
  }, [userLat, userLng, config]);

  const useBrowserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationChange(
            position.coords.latitude,
            position.coords.longitude,
            'Lokasi GPS Riil Browser'
          );
        },
        (error) => {
          alert("Gagal mengakses GPS: " + error.message + ". Silakan pakai tombol simulator saja.");
        }
      );
    } else {
      alert("Browser tidak mendukung geolokasi.");
    }
  };

  const handleScanSimulation = (tableNo: string) => {
    const randomShiftLat = (Math.random() - 0.5) * 0.00005;
    const randomShiftLng = (Math.random() - 0.5) * 0.00005;
    const targetLat = config.latitude + randomShiftLat;
    const targetLng = config.longitude + randomShiftLng;
    
    // update location
    onLocationChange(targetLat, targetLng, `Meja ${tableNo} (Scan QR Code)`);
    // update scanned table
    onScanTable(tableNo);
    setShowQRMenu(false);
  };

  const isWithinGeofence = distance <= config.geofenceRadiusMeters;

  return (
    <div id="geofence-simulator" className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-5 mb-8">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Radar Map Simulator Display */}
        <div className="w-full lg:w-1/3 flex flex-col items-center">
          <h4 className="text-sm font-bold text-emerald-950 mb-3 flex items-center gap-1.5 self-start uppercase tracking-wider">
            <Compass className="w-4 h-4 text-emerald-600 animate-spin" />
            Radar Geofencing Kedai
          </h4>
          
          <div className="relative w-48 h-48 rounded-full border border-emerald-250 bg-emerald-100/30 flex items-center justify-center overflow-hidden">
            {/* Range circle indicator */}
            <div className="absolute w-36 h-36 rounded-full border border-dashed border-emerald-450/40 bg-emerald-50/10 animate-pulse" />
            <div className="absolute w-12 h-12 rounded-full border border-emerald-200/60 bg-emerald-100/20" />

            {/* Resto Center Pivot */}
            <div className="absolute z-10 flex flex-col items-center">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
              </span>
              <span className="text-[9px] font-bold bg-slate-900 text-white px-1 mt-1 rounded shadow-xs">KEDAI</span>
            </div>

            {/* Customer relative displacement dot */}
            <div 
              className={`absolute z-20 flex flex-col items-center transition-all duration-700 ease-out`}
              style={{
                transform: `translate(${
                  distance === 0 ? 0 : isWithinGeofence ? (userLng - config.longitude) * 500000 : (userLng - config.longitude) * 10000
                }px, ${
                  distance === 0 ? 0 : isWithinGeofence ? -(userLat - config.latitude) * 500000 : -(userLat - config.latitude) * 10000
                }px)`
              }}
            >
              <div className={`h-4.5 w-4.5 rounded-full ${isWithinGeofence ? 'bg-emerald-600 ring-4 ring-emerald-100' : 'bg-red-600 ring-4 ring-red-100'} flex items-center justify-center shadow-lg`}>
                <Navigation className="w-2.5 h-2.5 text-white transform -rotate-45" />
              </div>
              <span className="text-[8px] font-bold bg-slate-800 text-white px-1 rounded mt-0.5 whitespace-nowrap">ANDA</span>
            </div>

            {/* Geofence Safe visual label */}
            <div className="absolute bottom-1 right-1 text-[9px] text-emerald-800 font-medium">
              Rmaks: {config.geofenceRadiusMeters}m
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
              isWithinGeofence 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {isWithinGeofence ? 'DINE-IN AKTIF (Di Lokasi)' : 'DINE-IN TERKUNCI (Terlalu Jauh)'}
            </span>
            <div className="text-[11px] text-slate-500 mt-2">
              Jarak Anda: <span className="font-bold text-slate-800">{distance.toLocaleString('id-ID')} meter</span>
            </div>
          </div>
        </div>

        {/* Location Simulator Control */}
        <div className="w-full lg:w-2/3 flex flex-col justify-between h-full">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
              <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-700" />
                SIMULASI GPS & SCAN QR MEJA
              </h4>
              <button 
                id="btn-use-browser-location"
                onClick={useBrowserLocation}
                className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200/70 px-2 py-1 rounded-md transition-colors"
              >
                Gunakan GPS Asli Browser
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Dine-In mensyaratkan Anda berada di dalam wilayah kedai (maks <span className="font-semibold text-slate-900">{config.geofenceRadiusMeters}m</span>) untuk menghindari pesanan fiktif. 
              {scannedTable ? (
                <span className="block mt-1.5 font-semibold text-emerald-800 bg-emerald-100/50 border border-emerald-200 p-1.5 rounded-lg">
                  ✓ Berhasil memindai QR Code di <span className="font-extrabold">{scannedTable}</span>! Lokasi diposisikan ke meja Anda secara otomatis.
                </span>
              ) : (
                <span className="block mt-1.5 text-slate-500">
                  ⚠️ Belum memindai kode meja. Silakan gunakan tombol scan simulasi QR di bawah untuk langsung menuju meja makan Anda!
                </span>
              )}
            </p>
          </div>



          {/* QR Scan Simulation Toggle & Selectors */}
          <div>
            <div className="flex items-center gap-2">
              <button
                id="btn-trigger-qr-scanner"
                onClick={() => setShowQRMenu(!showQRMenu)}
                className="flex items-center gap-1.5 bg-slate-900 text-white hover:bg-emerald-950 active:scale-95 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md focus:ring-2 focus:ring-emerald-500"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                SIMULASIKAN MEMINDAI QR MEJA
              </button>
              {scannedTable && (
                <button
                  id="btn-reset-scanned-table"
                  onClick={() => onScanTable(null)}
                  className="text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-2 rounded-xl font-medium transition-colors border border-slate-200"
                >
                  Reset Meja
                </button>
              )}
            </div>

            {showQRMenu && (
              <div className="mt-3 bg-white border border-slate-200 p-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-250">
                <div className="text-[10px] uppercase font-extrabold text-slate-500 mb-2 flex items-center gap-1">
                  <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
                  PILIH MEJA UNTUK PINDAI KODE QR FISIK:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {qrs.map((qr) => (
                    <button
                      id={`btn-simulate-qr-${qr.tableNo}`}
                      key={qr.tableNo}
                      onClick={() => handleScanSimulation(qr.tableNo)}
                      className="group flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-800 transition-all text-center"
                    >
                      <QrCode className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 mb-1" />
                      <span className="font-extrabold text-xs text-slate-900">{qr.tableNo}</span>
                      <span className="text-[8px] text-slate-500 truncate w-full">{qr.desc.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
