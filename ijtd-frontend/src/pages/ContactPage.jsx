import { useState } from 'react'
import PageHero from '../components/ui/PageHero'
import SectionHeading from '../components/shared/SectionHeading'
import FormInput from '../components/shared/FormInput'
import FormTextarea from '../components/shared/FormTextarea'
import { Mail, MapPin, Phone, Send } from 'lucide-react'

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div>
      <PageHero
        title="Contact IJTD"
        subtitle="Get in touch with us for any queries"
        breadcrumbs={[
          { title: 'Home', path: '/' },
          { title: 'Contact' }
        ]}
      />

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="md:col-span-2">
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
                {sent ? (
                  <div className="text-center py-12">
                    <Send className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-gray-600">We'll get back to you soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <FormInput label="Name" name="name" required value={formData.name} onChange={handleChange} />
                    <FormInput label="Email" name="email" type="email" required value={formData.email} onChange={handleChange} />
                    <FormInput label="Subject" name="subject" required value={formData.subject} onChange={handleChange} />
                    <FormTextarea label="Message" name="message" required rows={5} value={formData.message} onChange={handleChange} />
                    <button type="submit" className="btn-primary w-full">
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </button>
                  </form>
                )}
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="card">
                <Mail className="w-6 h-6 text-blue-700 mb-3" />
                <h3 className="font-semibold text-gray-900">Email</h3>
                <p className="text-sm text-gray-600">contact@ijtd.com</p>
              </div>
              <div className="card">
                <MapPin className="w-6 h-6 text-blue-700 mb-3" />
                <h3 className="font-semibold text-gray-900">Address</h3>
                <p className="text-sm text-gray-600">ASAIE Publishing, Yaoundé, Cameroon</p>
              </div>
              <div className="card">
                <Phone className="w-6 h-6 text-blue-700 mb-3" />
                <h3 className="font-semibold text-gray-900">Phone</h3>
                <p className="text-sm text-gray-600">+237 6XX XXX XXX</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ContactPage