import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Clock } from 'lucide-react';

export default function FreelancerManualEntryPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [project, setProject] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle manual time entry submission
    console.log({ date, project, startTime, endTime, description });
    // Reset form
    setProject('');
    setStartTime('');
    setEndTime('');
    setDescription('');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Manual Time Entry</h1>
        <p className="text-muted-foreground">
          Add time entries for work completed without using the timer
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Manual Entry Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Time Entry
              </CardTitle>
              <CardDescription>
                Fill out the form to manually log your time for a project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Date Picker */}
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Project Selection */}
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select value={project} onValueChange={setProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">Office Redesign</SelectItem>
                      <SelectItem value="residential">Residential Renovation</SelectItem>
                      <SelectItem value="commercial">Commercial Space Design</SelectItem>
                      <SelectItem value="retail">Retail Store Design</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What did you work on?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Entry
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Tips & Guidelines */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium mb-1">Be Accurate</p>
                <p className="text-xs text-muted-foreground">
                  Enter the exact times you worked to ensure accurate billing
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Add Details</p>
                <p className="text-xs text-muted-foreground">
                  Include a description of what you worked on for reference
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Review Before Submit</p>
                <p className="text-xs text-muted-foreground">
                  Double-check your entries before submitting
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Entries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs space-y-2">
                <div className="p-2 border rounded">
                  <p className="font-medium">Office Redesign</p>
                  <p className="text-muted-foreground">4 hours ago</p>
                </div>
                <div className="p-2 border rounded">
                  <p className="font-medium">Commercial Space</p>
                  <p className="text-muted-foreground">Yesterday</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
