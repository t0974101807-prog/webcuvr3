import React, { useState } from 'react';
import { Search, Filter, Eye, Download, Upload } from 'lucide-react';

export default function ContractsView({ language, user, records, setRecords, onOpenContractDetails, onDownloadContract, myPermissions }: { language: 'vi' | 'en', user?: any, records: any[], setRecords: (records: any[]) => void, onOpenContractDetails: (record: any, type: 'HĐDVPL' | 'HĐUQ') => void, onDownloadContract: (record: any, type: 'HĐDVPL' | 'HĐUQ') => void, myPermissions?: any }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const canViewAll = myPermissions ? myPermissions.viewAllRecords : ['admin', 'manager', 'head_of_department', 'director', 'deputyDirector', 'deputy_director', 'deputydirector', 'manage'].includes(user?.role || '');
  const userFilteredRecords = canViewAll ? records : records.filter(r => {
    const uName = user?.name;
    const uUsername = user?.username;
    return r.mainAssignee === uName || r.subAssignee === uName || r.authStaff1 === uName || r.authStaff2 === uName || r.authStaff3 === uName || r.manager === uName || r.lawyer === uName || r.specialist === uName || r.userEA === uName || r.userEA === uUsername;
  });

  const t = {
    vi: {
      title: 'Quản lý hợp đồng',
      searchPlaceholder: 'Tìm kiếm theo mã HĐ, tên khách hàng...',
      allTypes: 'Tất cả loại HĐ',
      hddvpl: 'HĐ Dịch vụ pháp lý (HĐDVPL)',
      hduq: 'HĐ Ủy quyền (HĐUQ)',
      contractId: 'Mã HĐ',
      type: 'Loại HĐ',
      caseName: 'Tên vụ việc',
      client: 'Khách hàng',
      date: 'Ngày lập',
      status: 'Trạng thái',
      actions: 'Hành động',
      noContracts: 'Chưa có hợp đồng nào',
      viewDetails: 'Xem chi tiết',
      download: 'Tải xuống',
    },
    en: {
      title: 'Contract Management',
      searchPlaceholder: 'Search by contract ID, client name...',
      allTypes: 'All Types',
      hddvpl: 'Legal Service Contract (HĐDVPL)',
      hduq: 'Power of Attorney (HĐUQ)',
      contractId: 'Contract ID',
      type: 'Type',
      caseName: 'Case Name',
      client: 'Client',
      date: 'Date',
      status: 'Status',
      actions: 'Actions',
      noContracts: 'No contracts yet',
      viewDetails: 'View Details',
      download: 'Download',
    }
  }[language];

  // Extract contracts from records
  const contracts: any[] = [];
  userFilteredRecords.forEach(record => {
    if (record.contractId) {
      contracts.push({
        ...record,
        displayContractId: record.contractId,
        contractType: 'HĐDVPL',
        contractTypeLabel: t.hddvpl,
      });
    }
    if (record.authContractId) {
      contracts.push({
        ...record,
        displayContractId: record.authContractId,
        contractType: 'HĐUQ',
        contractTypeLabel: t.hduq,
      });
    }
  });

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.displayContractId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.client && c.client.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (c.title && c.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || c.contractType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 font-serif">{t.title}</h3>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-slate-400 w-5 h-5" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
            >
              <option value="all">{t.allTypes}</option>
              <option value="HĐDVPL">{t.hddvpl}</option>
              <option value="HĐUQ">{t.hduq}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-700">{t.contractId}</th>
                <th className="px-6 py-4 font-bold text-slate-700">{t.type}</th>
                <th className="px-6 py-4 font-bold text-slate-700">{t.caseName}</th>
                <th className="px-6 py-4 font-bold text-slate-700">{t.client}</th>
                <th className="px-6 py-4 font-bold text-slate-700">{t.date}</th>
                <th className="px-6 py-4 font-bold text-slate-700">{t.status}</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredContracts.map((contract, index) => (
                <tr key={`${contract.id}-${contract.contractType}-${index}`} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{contract.displayContractId}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${contract.contractType === 'HĐDVPL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {contract.contractType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{contract.title || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{contract.client || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{contract.contractDetails?.contractDate || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                      {contract.contractDetails?.contractStatus || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => onOpenContractDetails(contract, contract.contractType)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title={t.viewDetails}>
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDownloadContract(contract, contract.contractType)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title={t.download}>
                        <Download className="w-4 h-4" />
                      </button>
                      <label className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center relative overflow-hidden" title="Tải PDF lên để đóng dấu QR">
                        <input 
                          type="file" 
                          accept="application/pdf" 
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              import('../utils/contractUtils').then(({ processUploadedContract }) => {
                                processUploadedContract(e.target.files![0], contract.contractType === 'HĐDVPL' ? contract.contractId : contract.authContractId);
                              });
                              e.target.value = '';
                            }
                          }}
                        />
                        <Upload className="w-4 h-4" />
                      </label>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredContracts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    {t.noContracts}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
