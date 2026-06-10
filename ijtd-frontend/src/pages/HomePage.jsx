import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronRight, TrendingUp, Globe, Award, Clock, Users, FileText } from 'lucide-react'
import PageHero from '../components/ui/PageHero'
import { articlesApi } from '../services/api'

const HomePage = () => {
  const [searchQuery, setSearchQuery]   = useState('')
  const [articles, setArticles]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [animatedStats, setAnimatedStats] = useState({
    articles: 0, reviewers: 0, countries: 0, citations: 0,
  })

  // Fetch latest articles from backend
  useEffect(() => {
    articlesApi.getLatest(4)
      .then(setArticles)
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [])

  // Animated counters
  useEffect(() => {
    const targets = { articles: 1250, reviewers: 890, countries: 75, citations: 15000 }
    let tick = 0
    const timer = setInterval(() => {
      tick++
      const p = tick / 50
      setAnimatedStats({
        articles:  Math.floor(targets.articles  * p),
        reviewers: Math.floor(targets.reviewers * p),
        countries: Math.floor(targets.countries * p),
        citations: Math.floor(targets.citations * p),
      })
      if (tick >= 50) { clearInterval(timer); setAnimatedStats(targets) }
    }, 40)
    return () => clearInterval(timer)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/current-issue?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <div>
      <PageHero
        title="International Journal of Transformative Development"
        subtitle="A multidisciplinary, peer-reviewed open access journal publishing transformative research across sciences, technology, and humanities."
        breadcrumbs={[{ title: 'Home', path: '/' }]}
      />

      {/* Search */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles by title, author, keyword, or DOI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-28 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-base transition-all"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-all"
              >
                <Search className="w-4 h-4 mr-2 inline" />Search
              </button>
            </form>
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {['Agriculture','Medicine','Engineering','Economics','Pharmacy','Technology'].map(tag => (
                <Link
                  key={tag}
                  to={`/current-issue?q=${tag}`}
                  className="text-xs text-gray-500 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200">
            {[
              { icon: FileText, label: 'Articles Published', value: animatedStats.articles,  suffix: '+' },
              { icon: Users,    label: 'Expert Reviewers',   value: animatedStats.reviewers, suffix: '+' },
              { icon: Globe,    label: 'Countries Reached',  value: animatedStats.countries, suffix: '+' },
              { icon: TrendingUp, label: 'Citations',        value: animatedStats.citations, suffix: '+' },
            ].map((s, i) => (
              <div key={i} className="py-8 text-center">
                <div className="text-3xl font-bold text-gray-900">{s.value.toLocaleString()}{s.suffix}</div>
                <div className="text-xs text-gray-500 font-semibold uppercase mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Publications</p>
              <h2 className="text-2xl font-display font-bold text-gray-900">Latest Articles</h2>
            </div>
            <Link to="/current-issue" className="hidden sm:flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-5 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {articles.map(a => (
                <article key={a.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-gray-300 transition-all group">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">{a.category}</span>
                    <span className="text-xs text-gray-400">{a.date}</span>
                  </div>
                  <h3 className="text-lg font-display font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors leading-snug">
                    <Link to={`/article/${a.id}`}>{a.title}</Link>
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">{a.authors}</p>
                  <span className="text-xs text-gray-400 font-mono">DOI: {a.doi}</span>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Publish */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-12">Why Publish With IJTD?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Clock,    title: 'Rapid Publication', desc: 'Peer review completed in 2-3 weeks with fast online publication' },
              { icon: Globe,    title: 'Global Visibility',  desc: 'Open access with worldwide readership. Indexed in major databases' },
              { icon: Award,    title: 'High Impact',        desc: 'Impact Factor of 10 with growing citations and comprehensive indexing' },
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-2xl hover:bg-white transition-all duration-300 group">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="w-8 h-8 text-blue-700" />
                </div>
                <h3 className="text-xl font-display font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">About IJTD</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Published by the African Scientific Association for Innovative and Entrepreneurship (ASAIE).
            ISSN: 1434-6028 (Print) | 1434-6036 (Online). Impact Factor: 10.
          </p>
          <Link to="/journal-information" className="text-blue-600 hover:text-blue-700 font-semibold">
            Learn more about the journal →
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage