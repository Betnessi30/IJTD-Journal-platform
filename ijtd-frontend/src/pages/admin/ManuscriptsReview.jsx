// src/pages/admin/ManuscriptsReview.jsx
import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { authFetchJson, adminUrl } from '../../utils/auth'
import {
  FileText, Search, ChevronDown, X, User, CheckCircle,
  XCircle, Clock, Send, AlertCircle, Loader, RefreshCw, Eye
} from 'lucide-react'

const STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'submitted',         label: 'Submitted' },
  { value: 'under_review',      label: 'Under Review' },
  { value: 'revision_required', label: 'Revision Required' },
  { value: 'accepted',          label: 'Accepted' },
  { value: 'rejected',          label: 'Rejected' },
  { value: 'published',         label: 'Published' },
]

const STATUS_STYLE = {
  submitted:          'bg-blue-50 text-blue-700 border-blue-200',
  under_review:       'bg-yellow-50 text-yellow-700 border-yellow-200',
  revision_required:  'bg-orange-50 text-orange-700 border-orange-200',
  accepted:           'bg-green-50 text-green-700 border-green-200',
  rejected:           'bg-red-50 text-red-700 border-red-200',
  published:          'bg-purple-50 text-purple-700 border-purple-200',
}

// ── Decision Modal ──────────────────────────────────────────────────────────
const DecisionModal = ({ manuscript, reviewers, onClose, onSave }) => {
  const [status, setStatus]     = useState(manuscript.status)
  const [comments, setComments] = useState(manuscript.reviewer_comments || '')
  const [reviewer, setReviewer] = useState(manuscript.assigned_reviewer || '')
  const [sendEmail, setSendEmail] = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      // Update status
      await authFetchJson(adminUrl(`/manuscripts/${manuscript.id}/status`), {
        method: 'PUT',
        body: JSON.stringify({ status, reviewer_comments: comments, send_email: sendEmail }),
      })
      // Assign reviewer if changed
      if (reviewer) {
        const rev = reviewers.find(r => r.full_name === reviewer)
        if (rev) {
          await authFetchJson(adminUrl(`/manuscripts/${manuscript.id}/assign-reviewer`), {
            method: 'PUT',
            body: JSON.stringify({ reviewer_id: rev.id }),
          })
        }
      }
      onSave()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Review Decision</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Manuscript</p>
            <p className="font-semibold text-gray-900 mt-1">{manuscript.title}</p>
            <p className="text-sm text-gray-500">{manuscript.authors} · {manuscript.manuscript_number}</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUSES.filter(s => s.value).map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign Reviewer
            </label>
            <select
              value={reviewer}
              onChange={e => setReviewer(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— No change —</option>
              {reviewers.map(r => (
                <option key={r.id} value={r.full_name}>{r.full_name} ({r.role})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Comments</label>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={6}
              placeholder="Add reviewer comments or decision feedback for the author…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={e => setSendEmail(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">Send decision email to corresponding author</span>
          </label>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2 font-semibold hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader className="w-4 h-4 animate-spin" />Saving…</> : <><Send className="w-4 h-4" />Save Decision</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
const ManuscriptsReview = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [manuscripts, setManuscripts]   = useState([])
  const [reviewers, setReviewers]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [total, setTotal]               = useState(0)
  const [page, setPage]                 = useState(1)
  const [search, setSearch]             = useState('')
  const [selected, setSelected]         = useState(null)

  const statusFilter = searchParams.get('status') || ''

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, per_page: 15 })
      if (statusFilter) params.append('status', statusFilter)
      const [data, revs] = await Promise.all([
        authFetchJson(adminUrl(`/manuscripts?${params}`)),
        authFetchJson(adminUrl('/reviewers')),
      ])
      setManuscripts(data.manuscripts || [])
      setTotal(data.total || 0)
      setReviewers(revs || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter, page])

  const filtered = search
    ? manuscripts.filter(m =>
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.authors.toLowerCase().includes(search.toLowerCase()) ||
        m.manuscript_number.toLowerCase().includes(search.toLowerCase())
      )
    : manuscripts

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manuscripts</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total submissions</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, author, or number…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setSearchParams(e.target.value ? { status: e.target.value } : {}); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No manuscripts found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Manuscript</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Submitted</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Reviewer</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(ms => (
                  <tr key={ms.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 line-clamp-1">{ms.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{ms.manuscript_number} · {ms.authors}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell capitalize">
                      {ms.manuscript_type}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${STATUS_STYLE[ms.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {ms.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{ms.submitted_at}</td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {ms.assigned_reviewer || <span className="text-gray-300">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelected(ms)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="w-3 h-3" />Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 15 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 15)}</p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >Prev</button>
              <button
                disabled={page >= Math.ceil(total / 15)}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >Next</button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <DecisionModal
          manuscript={selected}
          reviewers={reviewers}
          onClose={() => setSelected(null)}
          onSave={load}
        />
      )}
    </div>
  )
}

export default ManuscriptsReview