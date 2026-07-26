import React, { useState, useEffect } from 'react';
import {
  getTransactions,
  createTransaction,
  getAccountCategories,
  createAccountCategory,
  getFinancialSummary,
  TransactionData,
  AccountCategory,
  FinancialSummaryData
} from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

export default function Accounting() {
  const { user } = useAuth();
  const canManage = user?.role === 'Super Admin' || user?.role === 'Finance Officer';

  // Filters State
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedRange, setSelectedRange] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);

  // Data State
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [summary, setSummary] = useState<FinancialSummaryData | null>(null);
  const [categories, setCategories] = useState<AccountCategory[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal 1: Record Transaction Modal State
  const [isTrxModalOpen, setIsTrxModalOpen] = useState<boolean>(false);
  const [trxType, setTrxType] = useState<'Income' | 'Expense'>('Expense');
  const [trxCategoryId, setTrxCategoryId] = useState<string>('');
  const [trxAmount, setTrxAmount] = useState<string>('');
  const [trxDate, setTrxDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [trxRef, setTrxRef] = useState<string>('');
  const [trxDesc, setTrxDesc] = useState<string>('');
  const [trxLoading, setTrxLoading] = useState<boolean>(false);
  const [trxMessage, setTrxMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal 2: Category Management Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState<boolean>(false);
  const [catName, setCatName] = useState<string>('');
  const [catType, setCatType] = useState<'Income' | 'Expense'>('Expense');
  const [catDesc, setCatDesc] = useState<string>('');
  const [catLoading, setCatLoading] = useState<boolean>(false);
  const [catMessage, setCatMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch Ledger & Summary Data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch summary
      const summaryRes = await getFinancialSummary({
        range: selectedRange,
        startDate: selectedRange === 'custom' ? startDate : undefined,
        endDate: selectedRange === 'custom' ? endDate : undefined
      });
      setSummary(summaryRes);

      // Fetch transactions
      const params: any = { page, limit };
      if (selectedType !== 'All') params.type = selectedType;
      if (search) params.search = search;
      if (selectedRange === 'custom') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const trxRes = await getTransactions(params);
      setTransactions(trxRes.data);
      setTotalCount(trxRes.pagination.total);
      setTotalPages(trxRes.pagination.totalPages);

      // Fetch Categories
      const catData = await getAccountCategories();
      setCategories(catData);

    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch financial ledger data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedType, selectedRange, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  // Open Record Transaction Modal
  const handleOpenTrxModal = () => {
    setIsTrxModalOpen(true);
    setTrxMessage(null);
    setTrxAmount('');
    setTrxRef('');
    setTrxDesc('');
    
    // Set default category for selected type
    const matching = categories.filter(c => c.type === trxType);
    if (matching.length > 0) {
      setTrxCategoryId(String(matching[0].id));
    } else {
      setTrxCategoryId('');
    }
  };

  // Submit Manual Transaction
  const handleTrxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxCategoryId || !trxAmount || !trxDate || !trxDesc) {
      setTrxMessage({ type: 'error', text: 'Please fill in all mandatory fields.' });
      return;
    }

    try {
      setTrxLoading(true);
      setTrxMessage(null);

      const res = await createTransaction({
        category_id: parseInt(trxCategoryId, 10),
        type: trxType,
        amount: parseFloat(trxAmount),
        transaction_date: trxDate,
        reference_no: trxRef ? trxRef.trim() : undefined,
        description: trxDesc.trim()
      });

      if (res.success) {
        setTrxMessage({ type: 'success', text: res.message });
        fetchData();
        setTimeout(() => {
          setIsTrxModalOpen(false);
          setTrxMessage(null);
        }, 1500);
      }
    } catch (err: any) {
      setTrxMessage({ 
        type: 'error', 
        text: err.response?.data?.message || err.message || 'Failed to record transaction.' 
      });
    } finally {
      setTrxLoading(false);
    }
  };

  // Submit New Category
  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catType) {
      setCatMessage({ type: 'error', text: 'Category name and type are required.' });
      return;
    }

    try {
      setCatLoading(true);
      setCatMessage(null);

      const res = await createAccountCategory({
        name: catName.trim(),
        type: catType,
        description: catDesc ? catDesc.trim() : undefined
      });

      if (res.success) {
        setCatMessage({ type: 'success', text: res.message });
        setCatName('');
        setCatDesc('');
        // Refresh categories
        const catData = await getAccountCategories();
        setCategories(catData);
      }
    } catch (err: any) {
      setCatMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to create category.'
      });
    } finally {
      setCatLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const url = `http://localhost:5000/api/accounting/export-csv?type=${selectedType === 'All' ? '' : selectedType}`;
    
    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financial_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-poppins text-[#333333] leading-tight">
            General Ledger & Financial Accounting {totalCount > 0 && <span className="text-xs font-normal text-gray-400 ml-1">({totalCount})</span>}
          </h2>
          <p className="text-xs text-gray-500 font-inter mt-1">
            Track income (auto-synced from verified challan payments) and expenses, manage Chart of Accounts, and view financial statements.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 self-start md:self-auto font-poppins">
          {canManage && (
            <>
              <button
                onClick={() => setIsCatModalOpen(true)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <span className="material-icons text-sm">account_tree</span>
                Chart of Accounts
              </button>
              
              <button
                onClick={handleOpenTrxModal}
                className="bg-primary hover:bg-[#00523C] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <span className="material-icons text-sm">add_circle</span>
                Record Transaction
              </button>
            </>
          )}

          <button
            onClick={handleExportCSV}
            className="bg-accent/10 hover:bg-accent text-accent hover:text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <span className="material-icons text-sm">download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Income */}
        <div className="bg-white border border-gray-100 rounded-card shadow-sm p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-poppins block">
              Total Income
            </span>
            <h3 className="text-2xl font-bold font-poppins text-primary mt-1">
              PKR {(summary?.summary.totalIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-gray-400 font-inter mt-1.5 flex items-center gap-1">
              <span className="material-icons text-xs text-primary">sync</span>
              Includes Phase 6 verified payments
            </p>
          </div>
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <span className="material-icons text-2xl">trending_up</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white border border-gray-100 rounded-card shadow-sm p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-poppins block">
              Total Expenses
            </span>
            <h3 className="text-2xl font-bold font-poppins text-danger mt-1">
              PKR {(summary?.summary.totalExpenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-gray-400 font-inter mt-1.5">
              Office rent, salaries, utilities & ops
            </p>
          </div>
          <div className="w-12 h-12 bg-danger/10 text-danger rounded-full flex items-center justify-center">
            <span className="material-icons text-2xl">trending_down</span>
          </div>
        </div>

        {/* Net Surplus / Deficit */}
        <div className="bg-white border border-gray-100 rounded-card shadow-sm p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-poppins block">
              Net Balance ({summary?.summary.isSurplus ? 'Surplus' : 'Deficit'})
            </span>
            <h3 className={`text-2xl font-bold font-poppins mt-1 ${
              (summary?.summary.netBalance || 0) >= 0 ? 'text-primary' : 'text-danger'
            }`}>
              PKR {(summary?.summary.netBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-gray-400 font-inter mt-1.5">
              Cumulative financial position
            </p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            (summary?.summary.netBalance || 0) >= 0 ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
          }`}>
            <span className="material-icons text-2xl">account_balance_wallet</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Date Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 gap-3">
        <div className="flex flex-wrap -mb-px text-xs font-semibold font-poppins gap-1">
          {['All', 'Income', 'Expense'].map((t) => (
            <button
              key={t}
              onClick={() => { setSelectedType(t); setPage(1); }}
              className={`px-4 py-2.5 border-b-2 transition-all ${
                selectedType === t
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              {t === 'All' ? 'All Transactions' : `${t} Only`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pb-2 sm:pb-0">
          <select
            value={selectedRange}
            onChange={(e) => { setSelectedRange(e.target.value); setPage(1); }}
            className="bg-[#F4F6F5] px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-poppins text-gray-700 outline-none"
          >
            <option value="all">All Time</option>
            <option value="this_month">This Month</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {selectedRange === 'custom' && (
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#F4F6F5] p-1.5 border border-gray-200 rounded text-xs"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#F4F6F5] p-1.5 border border-gray-200 rounded text-xs"
              />
              <button 
                onClick={fetchData} 
                className="bg-primary text-white text-xs px-2.5 py-1.5 rounded font-poppins font-semibold"
              >
                Go
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-2.5 material-icons text-gray-400 text-base">search</span>
          <input
            type="text"
            placeholder="Search by Description, Reference Number, or Challan Number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F4F6F5] pl-10 pr-4 py-2 border border-transparent rounded-lg text-xs font-inter focus:outline-none focus:bg-white focus:border-primary/20 transition-all"
          />
        </div>
        <button
          type="submit"
          className="bg-primary hover:bg-[#00523C] text-white px-5 py-2 rounded-lg text-xs font-bold font-poppins shadow-sm transition"
        >
          Search
        </button>
      </form>

      {/* Transactions Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-lg text-xs font-semibold">
          {error}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-[#FAFBFB] rounded-card border border-dashed border-gray-200">
          <span className="material-icons text-4xl text-gray-300 mb-2">account_balance</span>
          <h3 className="text-sm font-bold font-poppins text-gray-600">No ledger transactions found</h3>
          <p className="text-[11px] text-gray-400 font-inter mt-1 max-w-xs">
            Approved payment receipts in Phase 6 automatically log Income entries here. You can also manually record expenses and non-challan income.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-gray-100 rounded-card bg-white">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFBFB] border-b border-gray-100 text-gray-500 font-poppins font-semibold">
                  <th className="px-5 py-3">ID & Date</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Reference No</th>
                  <th className="px-5 py-3 text-right">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-inter text-gray-600">
                {transactions.map((t) => {
                  const isIncome = t.type === 'Income';
                  return (
                    <tr key={t.id} className="hover:bg-[#FAFBFB] transition-colors">
                      <td className="px-5 py-3">
                        <span className="font-mono text-gray-400 text-[10px] block">#{t.id}</span>
                        <span className="font-semibold text-gray-800">{new Date(t.transaction_date).toLocaleDateString()}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold font-poppins ${
                          isIncome ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-danger/10 text-danger border border-danger/20'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-semibold text-gray-700">
                        {t.category_name}
                      </td>
                      <td className="px-5 py-3 max-w-xs">
                        <p className="text-gray-800 font-medium leading-relaxed">{t.description}</p>
                        {t.challan_number && (
                          <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                            Challan: {t.challan_number}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono text-gray-500">
                        {t.reference_no || '—'}
                      </td>
                      <td className={`px-5 py-3 text-right font-bold text-sm ${isIncome ? 'text-primary' : 'text-danger'}`}>
                        {isIncome ? '+' : '-'} PKR {parseFloat(t.amount as any).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 font-poppins">
              <span className="text-[11px] text-gray-400">
                Page <strong className="text-gray-700 font-bold">{page}</strong> of <strong className="text-gray-700 font-bold">{totalPages}</strong>
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-2.5 py-1.5 border border-gray-100 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1.5 border border-gray-100 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 1: Record Manual Transaction Modal   */}
      {/* ========================================== */}
      {isTrxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-card shadow-2xl max-w-md w-full p-6 space-y-5 animate-fadeIn border border-gray-100">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold font-poppins text-[#333333] flex items-center gap-2">
                <span className="material-icons text-primary">post_add</span>
                Record Manual Transaction
              </h3>
              <button 
                onClick={() => setIsTrxModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            {trxMessage && (
              <div className={`p-3 rounded-lg text-xs font-semibold ${
                trxMessage.type === 'success' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-danger/10 text-danger border border-danger/20'
              }`}>
                {trxMessage.text}
              </div>
            )}

            <form onSubmit={handleTrxSubmit} className="space-y-4 text-xs font-inter">
              {/* Type Switcher */}
              <div>
                <label className="block font-semibold text-gray-700 font-poppins mb-1">
                  1. Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTrxType('Expense');
                      const match = categories.filter(c => c.type === 'Expense');
                      if (match.length > 0) setTrxCategoryId(String(match[0].id));
                    }}
                    className={`py-2 rounded-lg font-poppins font-bold text-xs transition ${
                      trxType === 'Expense' ? 'bg-danger text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTrxType('Income');
                      const match = categories.filter(c => c.type === 'Income');
                      if (match.length > 0) setTrxCategoryId(String(match[0].id));
                    }}
                    className={`py-2 rounded-lg font-poppins font-bold text-xs transition ${
                      trxType === 'Income' ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Account Category */}
              <div>
                <label className="block font-semibold text-gray-700 font-poppins mb-1">
                  2. Chart of Accounts Category
                </label>
                <select
                  required
                  value={trxCategoryId}
                  onChange={(e) => setTrxCategoryId(e.target.value)}
                  className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg text-xs font-poppins focus:bg-white focus:border-primary outline-none"
                >
                  <option value="">-- Choose Category --</option>
                  {categories
                    .filter(c => c.type === trxType)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 font-poppins mb-1">
                    3. Amount (PKR)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="15000.00"
                    value={trxAmount}
                    onChange={(e) => setTrxAmount(e.target.value)}
                    className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg text-xs font-bold focus:bg-white focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 font-poppins mb-1">
                    4. Transaction Date
                  </label>
                  <input
                    type="date"
                    required
                    value={trxDate}
                    onChange={(e) => setTrxDate(e.target.value)}
                    className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg text-xs font-poppins focus:bg-white focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block font-semibold text-gray-700 font-poppins mb-1">
                  5. Reference / Receipt / Bill No (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. BILL-AUG-2026-004"
                  value={trxRef}
                  onChange={(e) => setTrxRef(e.target.value)}
                  className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg text-xs font-mono focus:bg-white focus:border-primary outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-gray-700 font-poppins mb-1">
                  6. Description / Memo
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Detailed description of expense or non-challan income..."
                  value={trxDesc}
                  onChange={(e) => setTrxDesc(e.target.value)}
                  className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:bg-white focus:border-primary"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTrxModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 transition font-poppins"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={trxLoading}
                  className="px-5 py-2 bg-primary hover:bg-[#00523C] text-white rounded-lg text-xs font-bold font-poppins shadow-sm transition disabled:opacity-50"
                >
                  {trxLoading ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: Chart of Accounts Categories Modal */}
      {/* ========================================== */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-card shadow-2xl max-w-lg w-full p-6 space-y-5 animate-fadeIn border border-gray-100 max-h-[85vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold font-poppins text-[#333333] flex items-center gap-2">
                <span className="material-icons text-primary">account_tree</span>
                Chart of Accounts Categories
              </h3>
              <button 
                onClick={() => setIsCatModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            {catMessage && (
              <div className={`p-3 rounded-lg text-xs font-semibold ${
                catMessage.type === 'success' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-danger/10 text-danger border border-danger/20'
              }`}>
                {catMessage.text}
              </div>
            )}

            {/* Add New Category Form */}
            <form onSubmit={handleCatSubmit} className="bg-[#FAFBFB] p-4 rounded-lg border border-gray-100 space-y-3 text-xs">
              <h4 className="font-bold font-poppins text-primary text-xs uppercase tracking-wider">
                Add Custom Category
              </h4>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Office Stationery"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="w-full bg-white p-2 border border-gray-200 rounded text-xs focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Type</label>
                  <select
                    value={catType}
                    onChange={(e) => setCatType(e.target.value as 'Income' | 'Expense')}
                    className="w-full bg-white p-2 border border-gray-200 rounded text-xs font-poppins focus:border-primary outline-none"
                  >
                    <option value="Expense">Expense</option>
                    <option value="Income">Income</option>
                  </select>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Optional description / scope..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full bg-white p-2 border border-gray-200 rounded text-xs focus:border-primary outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={catLoading}
                className="w-full bg-primary hover:bg-[#00523C] text-white py-1.5 rounded text-xs font-bold font-poppins transition disabled:opacity-50"
              >
                {catLoading ? 'Creating...' : '+ Add Category'}
              </button>
            </form>

            {/* Pre-seeded & Existing Categories List */}
            <div className="space-y-2 text-xs font-inter">
              <h4 className="font-bold font-poppins text-gray-700 text-xs">
                Existing Categories ({categories.length})
              </h4>
              <div className="divide-y divide-gray-100 max-h-52 overflow-y-auto border border-gray-100 rounded-lg bg-white">
                {categories.map((c) => (
                  <div key={c.id} className="p-2.5 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-800">{c.name}</p>
                      {c.description && <p className="text-[10px] text-gray-400">{c.description}</p>}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-poppins ${
                      c.type === 'Income' ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
                    }`}>
                      {c.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
