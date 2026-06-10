import { useState } from 'react'
import PageHero from '../../components/ui/PageHero'
import FormInput from '../../components/shared/FormInput'
import { Search, Loader, CheckCircle, Clock, AlertCircle, XCircle, FileText } from 'lucide-react'
import { manuscriptsApi } from '../../services/api'

const STATUS_CONFIG = {
  submitted:         { label: 'Submitted',          icon: FileText,    color: 'blue'   },
  under_review:      { label: 'Under Review',        icon: Clock,       color: 'yellow' },
  revision_required: { label: 'Revision Required',   icon: AlertCircle, color: 'orange' },
  accepted:          { label: 'Accepted',            icon: CheckCircle, color: 'green'  },
  published:         { label: 'Published',           icon: CheckCircle, color: 'green'  },
  rejected:          { label: 'Rejected',            icon: XCircle,     color: 'red'    },
}

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, icon: FileText, color: 'gray' }
  const Icon = cfg.icon
  const colors = {
    blue:   'bg-blue-50   text-blue-700   border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    green:  'bg-green-50  text-green-700  border-green-200',
    red:    'bg-red-50    text-red-700    border-red-200',
    gray:   'bg-gray-50   text-gray-700   border-gray-200',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-semibold ${colors[cfg.color]}`}>
      <Icon className="w-4 h-4" />
      {cfg.label}
    </span>
  )
}

const TrackManuscript = () => {
  const [email, setEmail]           = useState('')
  const [msNumber, setMsNumber]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [results, setResults]       = useState(null)
  const [error, setError]           = useState(null)

  const handleTrack = async (e) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const data = await manuscriptsApi.track(email.trim(), msNumber.trim())
      setResults(data)
    } catch (err) {
      setError(err.message || 'No manuscripts found.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHero
        title="Track Manuscript Status"
        subtitle="Check the current status of your submitted manuscript"
        breadcrumbs={[
          { title: 'Home', path: '/' },
          { title: 'For Authors' },
          { title: 'Track Manuscript' },
        ]}
      />

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <form onSubmit={handleTrack} className="space-y-4">
              <FormInput
                label="Corresponding Author Email"
                name="email"
                type="email"
                placeholder="Enter the email used during submission"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <FormInput
                label="Manuscript Number (optional)"
                name="msNumber"
                placeholder="e.g. IJTD-2026-00001"
                value={msNumber}
                onChange={(e) => setMsNumber(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading
                  ? <><Loader className="w-5 h-5 animate-spin" /> Searching...</>
                  : <><Search className="w-5 h-5" /> Track Manuscript</>}
              </button>
            </form>

            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-4 text-sm">
                {error}
              </div>
            )}

            {results && (
              <div className="mt-8 space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-3">
                  {results.length} manuscript{results.length !== 1 ? 's' : ''} found
                </h3>
                {results.map((ms) => (
                  <div key={ms.manuscript_number} className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <span className="text-xs font-mono text-gray-500">{ms.manuscript_number}</span>
                        <h4 className="font-bold text-gray-900 mt-1 leading-snug">{ms.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{ms.authors}</p>
                      </div>
                      <StatusBadge status={ms.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Type:</span> {ms.manuscript_type}
                      </div>
                      <div>
                        <span className="font-medium">Submitted:</span> {ms.submitted_at}
                      </div>
                      <div>
                        <span className="font-medium">Last updated:</span> {ms.updated_at}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default TrackManuscript