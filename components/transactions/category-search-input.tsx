'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Search, X, Loader2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  categoryGroup: {
    id: string
    name: string
  }
}

interface CategorySearchInputProps {
  categories: Category[]
  value: string
  onChange: (categoryId: string) => void
  placeholder?: string
  className?: string
  error?: string
}

export function CategorySearchInput({ 
  categories, 
  value, 
  onChange, 
  placeholder = "Search categories...",
  className = "",
  error 
}: CategorySearchInputProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [filteredCategories, setFilteredCategories] = useState<Category[]>(categories)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [displayValue, setDisplayValue] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Find selected category name for display
  useEffect(() => {
    if (value) {
      const selectedCategory = categories.find(cat => cat.id === value)
      if (selectedCategory) {
        setDisplayValue(`${selectedCategory.name} (${selectedCategory.categoryGroup?.name || 'Uncategorized'})`)
        setSearchTerm('')
      }
    } else {
      setDisplayValue('')
      setSearchTerm('')
    }
  }, [value, categories])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Show loading if there's a search term and we're searching
    if (searchTerm.trim() !== '' && isOpen) {
      setIsSearching(true)
    }

    debounceRef.current = setTimeout(() => {
      if (searchTerm.trim() === '') {
        setFilteredCategories(categories)
      } else {
        const filtered = categories.filter(category =>
          category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.categoryGroup?.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setFilteredCategories(filtered)
      }
      setSelectedIndex(-1)
      setIsSearching(false) // Hide loading when search completes
    }, 300) // 300ms debounce

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchTerm, categories, isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
        setIsSearching(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputClick = () => {
    setIsOpen(true)
    setSearchTerm(displayValue)
    setDisplayValue('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    if (!isOpen) setIsOpen(true)
  }

  const handleCategorySelect = (category: Category) => {
    onChange(category.id)
    setIsOpen(false)
    setSelectedIndex(-1)
    searchInputRef.current?.blur()
  }

  const handleClearSelection = () => {
    onChange('')
    setSearchTerm('')
    setIsOpen(false)
    setSelectedIndex(-1)
    searchInputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
        setSearchTerm(displayValue)
        setDisplayValue('')
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredCategories.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && filteredCategories[selectedIndex]) {
          handleCategorySelect(filteredCategories[selectedIndex])
        } else if (filteredCategories.length === 1) {
          handleCategorySelect(filteredCategories[0])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSelectedIndex(-1)
        setIsSearching(false)
        if (value) {
          // Restore display value if there was a selection
          const selectedCategory = categories.find(cat => cat.id === value)
          if (selectedCategory) {
            setDisplayValue(`${selectedCategory.name} (${selectedCategory.categoryGroup?.name || 'Uncategorized'})`)
            setSearchTerm('')
          }
        } else {
          setSearchTerm('')
          setDisplayValue('')
        }
        searchInputRef.current?.blur()
        break
    }
  }

  // Highlight matching text
  const highlightMatch = (text: string, search: string) => {
    if (!search.trim()) return text
    
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          value={isOpen ? searchTerm : displayValue}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-500' : ''
          } ${className}`}
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {value && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (isOpen) {
                setIsOpen(false)
              } else {
                handleInputClick()
              }
            }}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
          >
            {isOpen ? <ChevronDown className="w-4 h-4 transform rotate-180" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {!isOpen && !value && (
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        )}
        
        {isOpen && isSearching && (
          <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin pointer-events-none" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* No Category Option */}
          <div
            className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
              selectedIndex === -1 ? 'bg-blue-50 text-blue-700' : ''
            }`}
            onClick={() => {
              onChange('')
              setIsOpen(false)
              setSelectedIndex(-1)
            }}
          >
            <div className="flex items-center">
              <span className="text-lg mr-2">💸</span>
              <span className="font-medium">No Category</span>
              <span className="text-gray-500 ml-2">(Uncategorized)</span>
            </div>
          </div>

          {/* Categories */}
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category, index) => (
              <div
                key={category.id}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                  selectedIndex === index ? 'bg-blue-50 text-blue-700' : ''
                }`}
                onClick={() => handleCategorySelect(category)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {highlightMatch(category.name, searchTerm)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {highlightMatch(category.categoryGroup?.name || 'Uncategorized', searchTerm)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-3 py-4 text-gray-500 text-center">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <div>No categories found</div>
              <div className="text-sm">Try a different search term</div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
} 