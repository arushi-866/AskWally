import React from 'react';
import { Sparkles, Tag, DollarSign } from 'lucide-react';
import type { ParsedQuery } from '../utils/queryParser';

interface SearchSummaryProps {
  query: string;
  resultCount: number;
  parsedQuery: ParsedQuery;
  aiResponse?: string;
  totalResults?: number;
}

export const SearchSummary: React.FC<SearchSummaryProps> = ({ 
  query, 
  resultCount, 
  parsedQuery,
  aiResponse,
  totalResults
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-gray-200/50">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-walmart-blue to-walmart-blue-dark rounded-xl flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Search Results for: "{query}"
          </h2>
          
          <p className="text-gray-600 mb-4">
            Found {resultCount} products matching your criteria
            {totalResults && totalResults > resultCount && (
              <span className="text-sm text-gray-500 ml-2">
                (showing {resultCount} of {totalResults} total results)
              </span>
            )}
          </p>
          
          {/* AI Response */}
          {aiResponse && (
            <div className="mb-4 p-4 bg-gradient-to-r from-walmart-blue/5 to-walmart-yellow/5 rounded-lg border border-walmart-blue/20">
              <div className="flex items-start space-x-2">
                <Sparkles className="w-5 h-5 text-walmart-blue mt-0.5 flex-shrink-0" />
                <p className="text-gray-700 text-sm leading-relaxed">{aiResponse}</p>
              </div>
            </div>
          )}
          
          {/* Parsed Query Details */}
          <div className="flex flex-wrap items-center gap-3">
            {parsedQuery.category && parsedQuery.category !== 'general' && (
              <div className="flex items-center space-x-2 bg-walmart-blue/10 text-walmart-blue px-3 py-1 rounded-full">
                <Tag className="w-4 h-4" />
                <span className="text-sm font-medium capitalize">{parsedQuery.category}</span>
              </div>
            )}
            
            {parsedQuery.filters.color && (
              <div className="flex items-center space-x-2 bg-accent-purple/10 text-accent-purple px-3 py-1 rounded-full">
                <div className={`w-3 h-3 rounded-full bg-${parsedQuery.filters.color}-500`}></div>
                <span className="text-sm font-medium capitalize">{parsedQuery.filters.color}</span>
              </div>
            )}
            
            {parsedQuery.filters.price_max && (
              <div className="flex items-center space-x-2 bg-accent-success/10 text-accent-success px-3 py-1 rounded-full">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Under ${parsedQuery.filters.price_max}</span>
              </div>
            )}
            
            {parsedQuery.filters.rating_min && (
              <div className="flex items-center space-x-2 bg-walmart-yellow/20 text-walmart-yellow-dark px-3 py-1 rounded-full">
                <span className="text-sm font-medium">{parsedQuery.filters.rating_min}+ Stars</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};