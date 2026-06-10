import { useState } from 'react'
import PageHero from '../../components/ui/PageHero'
import FormInput from '../../components/shared/FormInput'
import FormTextarea from '../../components/shared/FormTextarea'
import { Upload, FileText, CheckCircle, Loader } from 'lucide-react'
import { manuscriptsApi } from '../../services/api'

const SubmitManuscript = () => {
  const [formData, setFormData] = useState({
    manuscriptType: '',
    title: '',
    abstract: '',
    keywords: '',
    authors: '',
    email: '',
    file: null,
  })
  const [errors, setErrors]     = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult]     = useState(null)   // { number } on success
  const [apiError, setApiError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, file }))
      if (errors.file) setErrors(prev => ({ ...prev, file: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.manuscriptType) newErrors.manuscriptType = 'Required'
    if (!formData.title)          newErrors.title          = 'Required'
    if (!formData.abstract)       newErrors.abstract       = 'Required'
    if (!formData.keywords)       newErrors.keywords       = 'Required'
    if (!formData.authors)        newErrors.authors        = 'Required'
    if (!formData.email)          newErrors.email          = 'Required'
    if (!formData.file)           newErrors.file           = 'Please upload your manuscript'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setSubmitting(true)
    setApiError(null)

    try {
      const fd = new FormData()
      fd.append('manuscriptType', formData.manuscriptType)
      fd.append('title',          formData.title)
      fd.append('abstract',       formData.abstract)
      fd.append('keywords',       formData.keywords)
      fd.append('authors',        formData.authors)
      fd.append('email',          formData.email)
      if (formData.file) fd.append('file', formData.file)

      const res = await manuscriptsApi.submit(fd)
      setResult({ number: res.manuscript_number })
    } catch (err) {
      setApiError(err.message || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div>
        <PageHero
          title="Submit Manuscript"
          subtitle="Submission successful"
          breadcrumbs={[
            { title: 'Home', path: '/' },
            { title: 'For Authors' },
            { title: 'Submit Manuscript' },
          ]}
        />
        <section className="py-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Manuscript Submitted!</h2>
              <p className="text-gray-500 mb-4">Your manuscript number is:</p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl py-4 px-6 mb-6">
                <span className="text-2xl font-mono font-bold text-blue-700">{result.number}</span>
              </div>
              <p className="text-gray-600 mb-8">
                A confirmation email has been sent. Please quote this number in all future correspondence.
              </p>
              <button
                onClick={() => { setResult(null); setFormData({ manuscriptType:'', title:'', abstract:'', keywords:'', authors:'', email:'', file:null }) }}
                className="btn-primary"
              >
                Submit Another Manuscript
              </button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div>
      <PageHero
        title="Submit Manuscript"
        subtitle="Submit your research for publication in IJTD"
        breadcrumbs={[
          { title: 'Home', path: '/' },
          { title: 'For Authors' },
          { title: 'Submit Manuscript' },
        ]}
      />

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            {apiError && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-4">
                <FormInput
                  label="Manuscript Type"
                  name="manuscriptType"
                  type="select"
                  required
                  value={formData.manuscriptType}
                  onChange={handleChange}
                  error={errors.manuscriptType}
                >
                  <option value="">Select type...</option>
                  <option value="research">Research Article</option>
                  <option value="review">Review Article</option>
                  <option value="short">Short Communication</option>
                  <option value="case">Case Report</option>
                  <option value="colloquia">Colloquia</option>
                  <option value="topical">Topical Review</option>
                  <option value="roadmap">Roadmap Article</option>
                  <option value="perspective">Perspective Article</option>
                </FormInput>
              </div>

              <FormInput
                label="Title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
              />

              <FormTextarea
                label="Abstract (max 300 words)"
                name="abstract"
                required
                rows={6}
                value={formData.abstract}
                onChange={handleChange}
                error={errors.abstract}
              />

              <FormInput
                label="Keywords (4-6 keywords, comma separated)"
                name="keywords"
                required
                value={formData.keywords}
                onChange={handleChange}
                error={errors.keywords}
              />

              <FormInput
                label="Authors (full names, comma separated)"
                name="authors"
                required
                value={formData.authors}
                onChange={handleChange}
                error={errors.authors}
              />

              <FormInput
                label="Corresponding Author Email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Manuscript <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-400 font-normal ml-1">(DOC or DOCX only)</span>
                </label>
                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${errors.file ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-blue-400'}`}>
                  <input
                    type="file"
                    id="file"
                    accept=".doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium">
                      {formData.file ? formData.file.name : 'Click to upload manuscript'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">Max file size: 16 MB</p>
                  </label>
                </div>
                {errors.file && <p className="text-red-500 text-xs mt-1">{errors.file}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><Loader className="w-5 h-5 animate-spin" /> Submitting...</>
                ) : (
                  <><FileText className="w-5 h-5" /> Submit Manuscript</>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

export default SubmitManuscript