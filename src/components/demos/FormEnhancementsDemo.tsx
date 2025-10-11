import * as React from "react"
import { Input } from "@/components/ui/input"
import { FloatingLabelInput } from "@/components/ui/floating-label-input"
import {
  InputGroup,
  InputAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { MultiStepForm, Step } from "@/components/ui/multi-step-form"
import {
  useFormAutoSave,
  AutoSaveIndicator,
} from "@/components/ui/form-auto-save"
import {
  FormValidationSummary,
  ValidationError,
} from "@/components/ui/form-validation-summary"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const FormEnhancementsDemo: React.FC = () => {
  // Enhanced Input Demo State
  const [email, setEmail] = React.useState("")
  const [emailError, setEmailError] = React.useState("")
  const [emailSuccess, setEmailSuccess] = React.useState(false)
  const [isValidating, setIsValidating] = React.useState(false)

  // Floating Label Demo State
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")

  // Input Group Demo State
  const [website, setWebsite] = React.useState("")
  const [price, setPrice] = React.useState("")

  // Multi-Step Form Demo State
  const [currentStep, setCurrentStep] = React.useState(0)
  const [formData, setFormData] = React.useState({
    personalInfo: { name: "", email: "" },
    address: { street: "", city: "" },
    preferences: { newsletter: false },
  })

  // Auto-Save Demo State
  const [autoSaveData, setAutoSaveData] = React.useState({
    title: "",
    content: "",
  })

  // Validation Summary Demo State
  const [validationErrors, setValidationErrors] = React.useState<
    ValidationError[]
  >([])

  // Email validation with debounce
  React.useEffect(() => {
    if (!email) {
      setEmailError("")
      setEmailSuccess(false)
      return
    }

    setIsValidating(true)
    const timer = setTimeout(() => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setEmailError("Please enter a valid email address")
        setEmailSuccess(false)
      } else {
        setEmailError("")
        setEmailSuccess(true)
      }
      setIsValidating(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [email])

  // Auto-save hook
  const { status: autoSaveStatus, lastSaved } = useFormAutoSave({
    data: autoSaveData,
    onSave: async (data) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Auto-saved:", data)
    },
    debounceMs: 1500,
    enabled: true,
  })

  // Multi-step form steps
  const steps: Step[] = [
    {
      id: "personal",
      title: "Personal Info",
      description: "Tell us about yourself",
      content: (
        <div className="space-y-4">
          <FloatingLabelInput
            label="Full Name"
            value={formData.personalInfo.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, name: e.target.value },
              })
            }
          />
          <FloatingLabelInput
            label="Email Address"
            type="email"
            value={formData.personalInfo.email}
            onChange={(e) =>
              setFormData({
                ...formData,
                personalInfo: {
                  ...formData.personalInfo,
                  email: e.target.value,
                },
              })
            }
          />
        </div>
      ),
      isValid: formData.personalInfo.name && formData.personalInfo.email,
    },
    {
      id: "address",
      title: "Address",
      description: "Where do you live?",
      content: (
        <div className="space-y-4">
          <FloatingLabelInput
            label="Street Address"
            value={formData.address.street}
            onChange={(e) =>
              setFormData({
                ...formData,
                address: { ...formData.address, street: e.target.value },
              })
            }
          />
          <FloatingLabelInput
            label="City"
            value={formData.address.city}
            onChange={(e) =>
              setFormData({
                ...formData,
                address: { ...formData.address, city: e.target.value },
              })
            }
          />
        </div>
      ),
      isValid: formData.address.street && formData.address.city,
    },
    {
      id: "preferences",
      title: "Preferences",
      description: "Customize your experience",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="newsletter"
              checked={formData.preferences.newsletter}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preferences: { newsletter: e.target.checked },
                })
              }
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="newsletter">Subscribe to newsletter</Label>
          </div>
        </div>
      ),
      isValid: true,
    },
  ]

  // Trigger validation errors
  const triggerValidationErrors = () => {
    setValidationErrors([
      { field: "Email", message: "Email address is required" },
      { field: "Password", message: "Password must be at least 8 characters" },
      { field: "Username", message: "Username is already taken" },
    ])
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Form Enhancements Demo</h1>
        <p className="text-muted-foreground">
          Comprehensive showcase of modern form components and patterns
        </p>
      </div>

      {/* Enhanced Input Components */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Input with Real-time Validation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email-input">Email Address</Label>
            <Input
              id="email-input"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              success={emailSuccess}
              isLoading={isValidating}
              leftIcon={
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Floating Label Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>Floating Label Inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FloatingLabelInput
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            helperText="Choose a unique username"
          />
          <FloatingLabelInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Must be at least 8 characters"
          />
        </CardContent>
      </Card>

      {/* Input Groups */}
      <Card>
        <CardHeader>
          <CardTitle>Input Groups with Addons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Website URL</Label>
            <InputGroup>
              <InputAddon position="left">https://</InputAddon>
              <InputGroupInput
                hasLeftAddon
                placeholder="example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </InputGroup>
          </div>
          <div>
            <Label>Price</Label>
            <InputGroup>
              <InputAddon position="left">$</InputAddon>
              <InputGroupInput
                hasLeftAddon
                hasRightAddon
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <InputAddon position="right">USD</InputAddon>
            </InputGroup>
          </div>
        </CardContent>
      </Card>

      {/* Form Validation Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Form Validation Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={triggerValidationErrors}>
            Trigger Validation Errors
          </Button>
          <FormValidationSummary
            errors={validationErrors}
            onErrorClick={(field) => {
              console.log("Navigate to field:", field)
              setValidationErrors([])
            }}
          />
        </CardContent>
      </Card>

      {/* Auto-Save Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Auto-Save Form</CardTitle>
            <AutoSaveIndicator status={autoSaveStatus} lastSaved={lastSaved} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <FloatingLabelInput
            label="Title"
            value={autoSaveData.title}
            onChange={(e) =>
              setAutoSaveData({ ...autoSaveData, title: e.target.value })
            }
            helperText="Changes are automatically saved"
          />
          <div>
            <Label htmlFor="content">Content</Label>
            <textarea
              id="content"
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
              placeholder="Start typing..."
              value={autoSaveData.content}
              onChange={(e) =>
                setAutoSaveData({ ...autoSaveData, content: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Multi-Step Form */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Step Form</CardTitle>
        </CardHeader>
        <CardContent>
          <MultiStepForm
            steps={steps}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onComplete={() => {
              console.log("Form completed:", formData)
              alert("Form completed successfully!")
            }}
            onCancel={() => {
              setCurrentStep(0)
              setFormData({
                personalInfo: { name: "", email: "" },
                address: { street: "", city: "" },
                preferences: { newsletter: false },
              })
            }}
            allowSkip={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
