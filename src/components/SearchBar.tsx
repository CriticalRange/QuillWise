import React from 'react'
import { Search, X, Filter } from 'lucide-react'
import { SearchFilters, Category } from '../types'
import { cn, debounce } from '../utils'

interface SearchBarProps {
  filters: SearchFilters
  categories: Category[]
  onFiltersChange: (filters: SearchFilters) => void
  placeholder?: string
  showCategoryFilter?: boolean
  showFavoriteFilter?: boolean
}

const SearchBar: React.FC<SearchBarProps> = ({
  filters,
  categories,
  onFiltersChange,
  placeholder = 'Search prompts...',
  showCategoryFilter = true,
  showFavoriteFilter = true
}) => {
  const [searchTerm, setSearchTerm] = React.useState(filters.searchTerm || '')
  const [showFilters, setShowFilters] = React.useState(false)

  // Debounced search to avoid too many updates
  const debouncedSearch = React.useMemo(
    () => debounce((term: string) => {
      onFiltersChange({ ...filters, searchTerm: term || undefined })
    }, 300),
    [filters, onFiltersChange]
  )

  React.useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm, debouncedSearch])

  const handleClearSearch = () => {
    setSearchTerm('')
    onFiltersChange({ ...filters, searchTerm: undefined })
  }

  const handleCategoryChange = (categoryId: string) => {
    onFiltersChange({
      ...filters,
      category: categoryId === 'all' ? undefined : categoryId
    })
  }

  const handleFavoriteToggle = () => {
    onFiltersChange({
      ...filters,
      isFavorite: filters.isFavorite ? undefined : true
    })
  }

  const hasActiveFilters = filters.category || filters.isFavorite

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="search-input"
        />
        
        {/* Clear Search */}
        {searchTerm && (
          <button
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      {(showCategoryFilter || showFavoriteFilter) && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center space-x-2 text-sm font-medium px-3 py-2 rounded-lg transition-colors duration-200',
              hasActiveFilters || showFilters
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5">
                {(filters.category ? 1 : 0) + (filters.isFavorite ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Clear All Filters */}
          {hasActiveFilters && (
            <button
              onClick={() => onFiltersChange({ searchTerm: filters.searchTerm })}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Filter Options */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
          {/* Category Filter */}
          {showCategoryFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200',
                    !filters.category
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={cn(
                      'px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200',
                      filters.category === category.id
                        ? 'text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                    style={{
                      backgroundColor: filters.category === category.id ? category.color : undefined
                    }}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Favorite Filter */}
          {showFavoriteFilter && (
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.isFavorite || false}
                  onChange={handleFavoriteToggle}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show only favorites
                </span>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar