import React,{useId} from 'react';
import {BusinessCodeInput} from '../../../shared/components/common/BusinessCodeInput';
import {NativeDialog} from '../../../shared/components/common/NativeDialog';
import {RoleCardSelector} from './RoleCardSelector';
import {PermissionsCustomizer} from './PermissionsCustomizer';

export function AdminUserModalView({availableRoles,clusters,currentRoleDef,formData,handleChange,handleResetToTemplate,handleSelectRole,handleSubmit,handleTogglePermission,isEditing,isModifiedFromTemplate,loading,loadingRoles,onClose,permissions,setFormData,setPermissions}) {
  const id=useId();
  return <NativeDialog open title={isEditing?'Edit pengguna':'Tambah pengguna'} onClose={onClose} busy={loading} className="admin-account-dialog">
    <p className="admin-dialog-description">Lengkapi akun, pilih peran, lalu tinjau izin aksesnya.</p>
    <form onSubmit={handleSubmit} className="admin-account-form">
      <fieldset disabled={loading} className="admin-account-fields"><legend className="sr-only">Rincian akun pengguna</legend>
        <div className="admin-account-details">
          <h3>Informasi akun</h3>
          <BusinessCodeInput entity="USER" value={formData.staffCode || ''} onChange={staffCode=>setFormData({...formData,staffCode})} existing={isEditing} disabled={loading}/>
          <label htmlFor={`${id}-name`}>Nama lengkap<input id={`${id}-name`} type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nama pengguna" autoComplete="name" required/></label>
          <label htmlFor={`${id}-email`}>Alamat email<input id={`${id}-email`} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="nama@perusahaan.com" autoComplete="off" required/></label>
          <label htmlFor={`${id}-password`}>Password<input id={`${id}-password`} type="password" name="password" value={formData.password} onChange={handleChange} placeholder={isEditing?'Kosongkan jika tidak diganti':'Minimal 6 karakter'} autoComplete="new-password" minLength={6} required={!isEditing}/></label>
          {loadingRoles?<p role="status">Memuat peran…</p>:<RoleCardSelector roles={availableRoles} selectedRole={formData.role} onSelectRole={handleSelectRole}/>}
          <p className="admin-field-hint">Penugasan sales dan wilayah dikelola melalui menu Tim sales setelah akun disimpan.</p>
          {formData.role!=='ADMIN'&&(currentRoleDef?.baseRole||formData.role)!=='SALES'&&<label htmlFor={`${id}-cluster`}>Kluster wilayah<select id={`${id}-cluster`} name="clusterId" value={formData.clusterId} onChange={handleChange}><option value="">Tanpa kluster</option>{clusters.map(cluster=><option key={cluster.id} value={cluster.id}>{cluster.name} ({cluster.region})</option>)}</select></label>}
        </div>
        <PermissionsCustomizer permissions={permissions} onTogglePermission={handleTogglePermission} onBulkSet={setPermissions} onResetToTemplate={handleResetToTemplate} selectedRoleName={currentRoleDef?.name||formData.role} isModified={isModifiedFromTemplate}/>
      </fieldset>
      <footer className="admin-dialog-actions"><button type="button" disabled={loading} onClick={onClose}>Batal</button><button type="submit" className="admin-primary-button" disabled={loading||loadingRoles}>{loading?'Menyimpan…':isEditing?'Simpan perubahan':'Buat pengguna'}</button></footer>
    </form>
  </NativeDialog>;
}
