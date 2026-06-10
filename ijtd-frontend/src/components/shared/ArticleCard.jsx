import { Link } from 'react-router-dom'
import { Calendar, User, FileText, Download, Eye } from 'lucide-react'

const ArticleCard = ({ article }) => {
  return (
    <article className="card group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
          {article.category}
        </span>
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          <span className="flex items-center">
            <Eye className="w-3 h-3 mr-1" />
            {article.views || 0}
          </span>
          <span className="flex items-center">
            <Download className="w-3 h-3 mr-1" />
            {article.downloads || 0}
          </span>
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors line-clamp-2">
        <Link to={`/article/${article.id}`}>
          {article.title}
        </Link>
      </h3>
      
      <p className="text-sm text-gray-600 mb-4 flex items-center">
        <User className="w-3 h-3 mr-2" />
        {article.authors}
      </p>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center text-xs text-gray-500">
          <Calendar className="w-3 h-3 mr-1" />
          {article.date}
        </div>
        <div className="text-xs text-gray-500">
          DOI: {article.doi}
        </div>
        <Link to={`/article/${article.id}`} className="text-sm font-medium text-blue-700 hover:text-blue-800 flex items-center transition-colors">
          <FileText className="w-4 h-4 mr-1" />
          Read More
        </Link>
      </div>
    </article>
  )
}

export default ArticleCard