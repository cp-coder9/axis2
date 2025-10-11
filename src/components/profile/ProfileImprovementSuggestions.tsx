import React, { useState, useEffect } from 'react'
import { User, UserRole } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Lightbulb, 
  TrendingUp, 
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react'
import { 
  calculateProfileCompleteness,
  ProfileCompletenessReport 
} from '../../services/profileValidationService'

interface ProfileImprovementSuggestionsProps {
  user: User
  onSuggestionClick: (fieldName: string) => void
  maxSuggestions?: number
}

interface Suggestion {
  id: string
  field: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  category: 'required' | 'recommended' | 'optional'
}

export function ProfileImprovementSuggestions({
  user,
  onSuggestionClick,
  maxSuggestions = 5
}: ProfileImprovementSuggestionsProps) {
  const [completenessReport, setCompletenessReport] = useState<ProfileCompletenessReport | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  useEffect(() => {
    loadSuggestions()
  }, [user])

  const loadSuggestions = () => {
    const report = calculateProfileCompleteness(user, user.role)
    setCompletenessReport(report)
    
    const generatedSuggestions = generateSuggestions(report)
    setSuggestions(generatedSuggestions.slice(0, maxSuggestions))
  }

  const generateSuggestions = (report: ProfileCompletenessReport): Suggestion[] => {
    const suggestions: Suggestion[] = []

    // Analyze validation results and create suggestions
    Object.entries(report.validationResults).forEach(([field, result]) => {
      if (!result.isValid) {
        const suggestion = createSuggestion(field, result, user.role)
        if (suggestion) {
          suggestions.push(suggestion)
        }
      }
    })

    // Sort by impact and category
    return suggestions.sort((a, b) => {
      // Required first
      if (a.category === 'required' && b.category !== 'required') return -1
      if (a.category !== 'required' && b.category === 'required') return 1
      
      // Then by impact
      const impactOrder = { high: 0, medium: 1, low: 2 }
      return impactOrder[a.impact] - impactOrder[b.impact]
    })
  }

  const createSuggestion = (
    field: string,
    result: any,
    role: UserRole
  ): Suggestion | null => {
    const fieldSuggestions: Record<string, Partial<Suggestion>> = {
      name: {
        title: 'Add Your Full Name',
        description: 'Your name helps others identify and connect with you',
        impact: 'high',
        category: 'required'
      },
      email: {
        title: 'Verify Your Email',
        description: 'A valid email is required for account security and notifications',
        impact: 'high',
        category: 'required'
      },
      title: {
        title: 'Add Your Job Title',
        description: 'Your title helps others understand your role and expertise',
        impact: 'high',
        category: 'required'
      },
      phone: {
        title: 'Add Phone Number',
        description: 'Phone number enables direct communication for urgent matters',
        impact: 'medium',
        category: 'recommended'
      },
      company: {
        title: 'Add Company Name',
        description: 'Company information is required for client profiles',
        impact: 'high',
        category: role === UserRole.CLIENT ? 'required' : 'optional'
      },
      hourlyRate: {
        title: 'Set Your Hourly Rate',
        description: 'Your rate is required to participate in projects and track earnings',
        impact: 'high',
        category: role === UserRole.FREELANCER ? 'required' : 'optional'
      },
      avatarUrl: {
        title: 'Upload Profile Picture',
        description: 'A professional photo increases trust and recognition',
        impact: 'medium',
        category: 'recommended'
      }
    }

    const suggestionTemplate = fieldSuggestions[field]
    if (!suggestionTemplate) return null

    return {
      id: field,
      field,
      title: suggestionTemplate.title || `Complete ${field}`,
      description: suggestionTemplate.description || result.message,
      impact: suggestionTemplate.impact || 'low',
      category: suggestionTemplate.category || 'optional'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-100'
      case 'medium':
        return 'text-orange-600 bg-orange-100'
      case 'low':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'required':
        return <Badge variant="destructive" className="text-xs">Required</Badge>
      case 'recommended':
        return <Badge variant="default" className="text-xs">Recommended</Badge>
      case 'optional':
        return <Badge variant="secondary" className="text-xs">Optional</Badge>
      default:
        return null
    }
  }

  if (!completenessReport || suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Profile Complete!
          </CardTitle>
          <CardDescription>
            Your profile is looking great. All essential information is filled in.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
          Profile Improvement Suggestions
        </CardTitle>
        <CardDescription>
          Complete these items to improve your profile and unlock all features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.id}
            className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
            onClick={() => onSuggestionClick(suggestion.field)}
          >
            <div className={`p-2 rounded-lg ${getImpactColor(suggestion.impact)}`}>
              {suggestion.category === 'required' ? (
                <Star className="h-4 w-4" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{suggestion.title}</span>
                {getCategoryBadge(suggestion.category)}
              </div>
              <p className="text-sm text-muted-foreground">
                {suggestion.description}
              </p>
            </div>

            <Button
              size="sm"
              variant="ghost"
              className="flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                onSuggestionClick(suggestion.field)
              }}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {suggestions.length >= maxSuggestions && (
          <p className="text-sm text-center text-muted-foreground pt-2">
            Showing top {maxSuggestions} suggestions
          </p>
        )}
      </CardContent>
    </Card>
  )
}
