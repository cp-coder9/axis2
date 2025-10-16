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
  PieChart,
  Activity,
  Download,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { useAppContext } from "@/contexts/AppContext"
import { cn } from "@/lib/utils"

interface EarningsChartData {
  date: string
  earnings: number
  hours: number
  projects: number
}

interface ProjectEarningsData {
  name: string
  earnings: number
  hours: number
  color: string
  [key: string]: any // Add index signature for Recharts compatibility
}

interface FreelancerEarningsDashboardProps {
  className?: string
}

export function FreelancerEarningsDashboard({
  className
}: FreelancerEarningsDashboardProps) {
  const { user } = useAppContext()
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area')

  const hourlyRate = user?.hourlyRate || 75

  // Mock earnings data over time
  const earningsChartData: EarningsChartData[] = useMemo(() => {
    const data = []
    const now = new Date()
    const periods = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : selectedPeriod === 'quarter' ? 90 : 365

    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)

      // Generate mock data with some variation
      const baseHours = selectedPeriod === 'week' ? 4 + Math.random() * 4 :
        selectedPeriod === 'month' ? 6 + Math.random() * 6 :
          selectedPeriod === 'quarter' ? 8 + Math.random() * 8 :
            10 + Math.random() * 10

      const hours = Math.round(baseHours * 10) / 10
      const earnings = Math.round(hours * hourlyRate * 100) / 100
      const projects = Math.floor(Math.random() * 3) + 1

      data.push({
        date: selectedPeriod === 'week' || selectedPeriod === 'month'
          ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : selectedPeriod === 'quarter'
            ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : date.toLocaleDateString('en-US', { month: 'short' }),
        earnings,
        hours,
        projects
      })
    }

    return data
  }, [selectedPeriod, hourlyRate])

  // Mock project earnings breakdown
  const projectEarningsData: ProjectEarningsData[] = useMemo(() => [
    { name: "Office Redesign", earnings: 3200, hours: 42.7, color: "#0ea5e9" },
    { name: "Residential Complex", earnings: 2800, hours: 37.3, color: "#10b981" },
    { name: "Retail Store Design", earnings: 1950, hours: 26.0, color: "#f59e0b" },
    { name: "Hotel Lobby", earnings: 1500, hours: 20.0, color: "#ef4444" },
    { name: "Corporate Campus", earnings: 900, hours: 12.0, color: "#8b5cf6" },
  ], [])

  // Calculate totals
  const totalEarnings = earningsChartData.reduce((sum, item) => sum + item.earnings, 0)
  const totalHours = earningsChartData.reduce((sum, item) => sum + item.hours, 0)
  const averageDaily = totalEarnings / earningsChartData.length
  const projectedMonthly = averageDaily * 30

  // Chart configuration
  const chartConfig = {
    earnings: {
      label: "Earnings",
      color: "hsl(var(--chart-1))",
    },
    hours: {
      label: "Hours",
      color: "hsl(var(--chart-2))",
    },
    projects: {
      label: "Projects",
      color: "hsl(var(--chart-3))",
    },
  }

  const renderChart = () => {
    const commonProps = {
      data: earningsChartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    }

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="earnings"
              stroke="var(--color-earnings)"
              fill="var(--color-earnings)"
              fillOpacity={0.3}
            />
          </AreaChart>
        )
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="earnings" fill="var(--color-earnings)" />
          </BarChart>
        )
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="earnings"
              stroke="var(--color-earnings)"
              strokeWidth={2}
            />
          </LineChart>
        )
      default:
        return null
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Earnings Dashboard</h2>
          <p className="text-muted-foreground">
            Track your income, hours, and project performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalEarnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod} period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              ${(totalEarnings / totalHours).toFixed(0)}/hr average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageDaily.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              per working day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Monthly</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${projectedMonthly.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              based on current rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Earnings Trend
            </CardTitle>
            <div className="flex gap-2">
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="area">Area</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px]">
            {renderChart()}
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Project Earnings Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={projectEarningsData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="earnings"
                    label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                  >
                    {projectEarningsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ${data.earnings.toLocaleString()} ({data.hours}h)
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            {/* Project List */}
            <div className="space-y-2 mt-4">
              {projectEarningsData.map((project) => (
                <div key={project.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <span>{project.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${project.earnings.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{project.hours}h</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hourly Rate Comparison */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Current Rate vs Market</span>
                <span className="font-medium">${hourlyRate}/hr</span>
              </div>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                75% of market rate (R 1,870/hr average)
              </p>
            </div>

            {/* Utilization Rate */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Weekly Utilization</span>
                <span className="font-medium">85%</span>
              </div>
              <Progress value={85} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                34 of 40 billable hours
              </p>
            </div>

            {/* Client Satisfaction */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Client Satisfaction</span>
                <span className="font-medium flex items-center gap-1">
                  4.8/5 <TrendingUp className="h-3 w-3 text-green-600" />
                </span>
              </div>
              <Progress value={96} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Based on 12 project reviews
              </p>
            </div>

            {/* Project Completion Rate */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>On-Time Delivery</span>
                <span className="font-medium">92%</span>
              </div>
              <Progress value={92} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                11 of 12 projects delivered on time
              </p>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 space-y-2">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="/freelancer/earnings/reports">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Detailed Reports
                </a>
              </Button>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="/freelancer/earnings/invoices">
                  <Calendar className="h-4 w-4 mr-2" />
                  Generate Invoice
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}