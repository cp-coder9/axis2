"use client"

import { useState, useMemo } from "react"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  Target,
  BarChart3,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAppContext } from "@/contexts/AppContext"
import { cn } from "@/lib/utils"

interface EarningsData {
  today: {
    hours: number
    earnings: number
    projects: number
  }
  week: {
    hours: number
    earnings: number
    target: number
    projects: number
  }
  month: {
    hours: number
    earnings: number
    target: number
    projects: number
  }
  year: {
    hours: number
    earnings: number
    target: number
  }
}

interface FreelancerEarningsWidgetProps {
  className?: string
  compact?: boolean
}

export function FreelancerEarningsWidget({ 
  className, 
  compact = false 
}: FreelancerEarningsWidgetProps) {
  const { user } = useAppContext()
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>('week')

  // Mock earnings data - in real implementation, this would come from API
  const earningsData: EarningsData = useMemo(() => ({
    today: {
      hours: 3.5,
      earnings: 262.50,
      projects: 2
    },
    week: {
      hours: 28.5,
      earnings: 2137.50,
      target: 3000,
      projects: 3
    },
    month: {
      hours: 124,
      earnings: 9300,
      target: 12000,
      projects: 8
    },
    year: {
      hours: 1456,
      earnings: 109200,
      target: 120000
    }
  }), [])

  const currentData = earningsData[selectedPeriod]
  const hourlyRate = user?.hourlyRate || 75

  // Calculate progress towards target
  const getTargetProgress = () => {
    if (!('target' in currentData)) return 0
    return Math.min((currentData.earnings / currentData.target) * 100, 100)
  }

  // Calculate trend (mock data for demonstration)
  const getTrend = () => {
    const trends = {
      today: { value: 12, isPositive: true },
      week: { value: 8, isPositive: true },
      month: { value: -3, isPositive: false },
      year: { value: 15, isPositive: true }
    }
    return trends[selectedPeriod]
  }

  const trend = getTrend()

  if (compact) {
    return (
      <Card className={cn("hover:shadow-md transition-shadow", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Earnings</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ${currentData.earnings.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {currentData.hours}h logged
          </p>
          <div className="mt-2 flex items-center text-xs">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
            )}
            <span className={trend.isPositive ? "text-green-600" : "text-red-600"}>
              {trend.isPositive ? '+' : ''}{trend.value}% from last {selectedPeriod}
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Earnings Overview
          </CardTitle>
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Earnings Display */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-green-600">
              ${currentData.earnings.toLocaleString()}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {currentData.hours}h logged
              </span>
              <span className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                ${hourlyRate}/hr
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={trend.isPositive ? "text-green-600" : "text-red-600"}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              vs last {selectedPeriod}
            </div>
          </div>
        </div>

        {/* Target Progress (if applicable) */}
        {'target' in currentData && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                Target Progress
              </span>
              <span className="font-medium">
                ${currentData.earnings.toLocaleString()} / ${currentData.target.toLocaleString()}
              </span>
            </div>
            <Progress value={getTargetProgress()} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{getTargetProgress().toFixed(1)}% complete</span>
              <span>${(currentData.target - currentData.earnings).toLocaleString()} remaining</span>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Active Projects</div>
            <div className="text-lg font-semibold">{(currentData as any).projects || 0}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Avg per Hour</div>
            <div className="text-lg font-semibold">
              ${currentData.hours > 0 ? (currentData.earnings / currentData.hours).toFixed(0) : '0'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a href="/freelancer/earnings/reports">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Reports
            </a>
          </Button>
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a href="/freelancer/earnings/invoices">
              <Calendar className="h-4 w-4 mr-2" />
              Invoices
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}