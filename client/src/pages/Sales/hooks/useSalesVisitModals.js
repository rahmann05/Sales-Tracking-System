import {useModal} from '../../../shared/hooks/useModal';
import {useApp} from '../../../context/AppContext';
import {notifySuccess} from '../../../services/notificationService';
export function useSalesVisitModals(){
  const app=useApp();
  const modal=useModal();
  const complete=async(action,args,message)=>{const result=await action(...args);if(result===false)throw new Error('Belum berhasil disimpan. Periksa informasi lalu coba lagi.');modal.closeModal();window.dispatchEvent(new CustomEvent('operational-data-changed'));notifySuccess(message);return result;};
  const handlers={
    handleSalesAbsenIn:(...args)=>complete(app.handleSalesAbsenIn,args,'Presensi masuk tersimpan. Kunjungan sedang berlangsung.'),
    handleSalesAbsenOut:(...args)=>complete(app.handleSalesAbsenOut,args,'Presensi keluar dan hasil kunjungan tersimpan.'),
    handleSubmitOrder:(...args)=>complete(app.handleSubmitOrder,args,'Order tersimpan untuk pemeriksaan. Selesaikan presensi keluar setelah kunjungan.'),
    handleReportClosedOutlet:(...args)=>complete(app.handleReportClosedOutlet,args,'Laporan toko tutup dikirim untuk keputusan Supervisor.'),
    handleRequestUnlockOutlet:(...args)=>complete(app.handleRequestUnlockOutlet,args,'Permintaan pengecualian dikirim untuk pemeriksaan.'),
    handleSalesAbsenOffPJP:(...args)=>complete(app.handleSalesAbsenOffPJP,args,'Pengajuan kunjungan luar PJP tersimpan. Periksa status validasinya.'),
  };
  return {...modal,handlers};
}
