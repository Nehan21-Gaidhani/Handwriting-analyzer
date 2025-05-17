"use client"

import type React from "react"

import { useState, useEffect } from "react"
import axios from "axios"
import {
  Upload,
  FileUp,
  Brain,
  Sparkles,
  AlertCircle,
  Sun,
  Moon,
  User,
  Users,
  Lightbulb,
  Heart,
  Smile,
  Frown,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"
import Image from "next/image"

// Trait icon mapping
const traitIcons: Record<string, React.ReactNode> = {
  confident: <User className="h-5 w-5" />,
  extrovert: <Users className="h-5 w-5" />,
  introvert: <User className="h-5 w-5" />,
  creative: <Lightbulb className="h-5 w-5" />,
  emotional: <Heart className="h-5 w-5" />,
  optimistic: <Smile className="h-5 w-5" />,
  pessimistic: <Frown className="h-5 w-5" />,
  // Add more trait mappings as needed
}

// Function to get icon for a trait
const getTraitIcon = (trait: string) => {
  const lowerTrait = trait.toLowerCase()

  // Check if any key in traitIcons is contained in the trait
  for (const [key, icon] of Object.entries(traitIcons)) {
    if (lowerTrait.includes(key)) {
      return icon
    }
  }

  // Default icon if no match is found
  return <Sparkles className="h-5 w-5" />
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [traits, setTraits] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailedAnalysis, setDetailedAnalysis] = useState<string | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [traitImages, setTraitImages] = useState<Record<string, string>>({})
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure theme component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)

    if (selectedFile) {
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an image file first")
      return
    }

    setError(null)
    setLoading(true)
    setDetailedAnalysis(null)
    setTraitImages({})

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await axios.post("http://localhost:8000/analyze/", formData)

      if (res.data.error) {
        setError(res.data.error)
        setTraits([])
      } else {
        setTraits(res.data.traits)
        // After getting traits, fetch detailed analysis and images
        fetchDetailedAnalysis(res.data.traits)
        fetchTraitImages(res.data.traits)
      }
    } catch (err) {
      setError("An error occurred during analysis. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDetailedAnalysis = async (traits: string[]) => {
    if (!traits.length) return

    setIsLoadingDetails(true)

    try {
      // Format the traits for the prompt
      const traitsText = traits.join(", ")
      const prompt = `Provide a detailed personality analysis for someone with these traits: ${traitsText}. Explain how these traits might manifest in their daily life, relationships, and work environment. Keep the response under 300 words and format it in paragraphs.`

      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        {
          contents: [{ parts: [{ text: prompt }] }],
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": "AIzaSyBKA2rozpT4vwILa1Ec_rKSaT1R49LHZCQ",
          },
        },
      )

      if (response.data.candidates && response.data.candidates[0].content) {
        const text = response.data.candidates[0].content.parts[0].text
        setDetailedAnalysis(text)
      } else {
        setError("Could not generate detailed analysis")
      }
    } catch (err) {
      console.error("Error fetching detailed analysis:", err)
      setError("Failed to generate detailed analysis")
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const fetchTraitImages = async (traits: string[]) => {
    if (!traits.length) return

    setIsLoadingImages(true)
    const newTraitImages: Record<string, string> = {}

    try {
      // Process each trait to get an image
      for (const trait of traits) {
        // Create a prompt for Gemini to generate an image description
        const prompt = `Generate a detailed description of a cartoon character that embodies the personality trait: "${trait}". The description should be visual and detailed enough to create an image. Focus on appearance, expression, posture, and clothing that would visually represent this trait.`

        const response = await axios.post(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
          {
            contents: [{ parts: [{ text: prompt }] }],
          },
          {
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": "AIzaSyBKA2rozpT4vwILa1Ec_rKSaT1R49LHZCQ",
            },
          },
        )

        if (response.data.candidates && response.data.candidates[0].content) {
          const description = response.data.candidates[0].content.parts[0].text

          // Now use this description to generate an image URL
          // For this example, we'll use a placeholder with the description encoded
          // In a real app, you would use this description with an image generation API
          const imageUrl = `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(trait)}`
          newTraitImages[trait] = imageUrl
        }
      }

      setTraitImages(newTraitImages)
    } catch (err) {
      console.error("Error fetching trait images:", err)
    } finally {
      setIsLoadingImages(false)
    }
  }

  // Force dark mode for testing
  useEffect(() => {
    // This ensures dark mode works properly
    document.documentElement.classList.add("dark")
  }, [])

  if (!mounted) {
    // Return a minimal UI to prevent hydration issues
    return <div className="min-h-screen bg-white dark:bg-gray-900"></div>
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-50 to-white dark:from-gray-900 dark:to-gray-800 dark:text-white transition-colors duration-200">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setTheme(theme === "dark" ? "light" : "dark")
            // Force theme change for testing
            if (theme === "dark") {
              document.documentElement.classList.remove("dark")
            } else {
              document.documentElement.classList.add("dark")
            }
          }}
          className="rounded-full bg-white/10 backdrop-blur-sm dark:bg-gray-800/50 border-teal-200 dark:border-gray-700"
        >
          {theme === "dark" ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-gray-700" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-7xl mx-auto">
          <Badge
            variant="outline"
            className="mb-4 px-3 py-1 text-sm bg-teal-50 text-teal-700 border-teal-200 dark:bg-gray-800 dark:text-teal-400 dark:border-teal-900"
          >
            Handwriting Analysis
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
            Discover Your Personality Through <span className="text-teal-600 dark:text-teal-400">Handwriting</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Upload your handwriting sample and our AI will analyze your personality traits, revealing insights about
            your character, emotions, and thinking patterns.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Button
              size="lg"
              className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="mr-2 h-5 w-5" /> Upload Sample
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-gray-800"
              onClick={() => document.getElementById("analyzer-section")?.scrollIntoView({ behavior: "smooth" })}
            >
              See How It Works
            </Button>
          </div>
          <div className="relative h-64 sm:h-80 md:h-96 rounded-xl overflow-hidden shadow-xl max-w-4xl mx-auto">
            <Image
              src="/placeholder.svg?height=600&width=1200"
              alt="Handwriting samples"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Analyzer Section */}
      <section
        id="analyzer-section"
        className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 transition-colors duration-200"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Analyze Your Handwriting</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Upload a clear image of your handwriting to discover what it reveals about your personality.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <Card className="border-teal-100 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <FileUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  Upload Handwriting
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Select a clear image of your handwriting on unlined paper
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    preview
                      ? "border-teal-300 bg-teal-50 dark:border-teal-800 dark:bg-gray-800"
                      : "border-gray-300 hover:border-teal-300 hover:bg-teal-50 dark:border-gray-700 dark:hover:border-teal-700 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

                  {preview ? (
                    <div className="relative h-64 w-full">
                      <Image
                        src={preview || "/placeholder.svg"}
                        alt="Handwriting preview"
                        fill
                        className="object-contain rounded-md"
                      />
                    </div>
                  ) : (
                    <div className="py-8">
                      <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Drag and drop an image here, or click to select a file
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Supported formats: JPG, PNG, GIF</p>
                    </div>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  className="w-full mt-4 bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
                  onClick={handleUpload}
                  disabled={loading || !file}
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-5 w-5" />
                      Analyze Handwriting
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-teal-100 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Sparkles className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  Analysis Results
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Your handwriting reveals these personality traits
                </CardDescription>
              </CardHeader>
              <CardContent>
                {traits.length > 0 ? (
                  <div className="space-y-4">
                    <Tabs defaultValue="list" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 dark:bg-gray-700">
                        <TabsTrigger value="list">List View</TabsTrigger>
                        <TabsTrigger value="card">Card View</TabsTrigger>
                        <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
                      </TabsList>
                      <TabsContent value="list" className="mt-4">
                        <ul className="space-y-2">
                          {traits.map((trait, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 p-2 rounded-md hover:bg-teal-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <div className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                                {getTraitIcon(trait)}
                              </div>
                              <span className="dark:text-gray-200 pt-1">{trait}</span>
                            </li>
                          ))}
                        </ul>
                      </TabsContent>
                      <TabsContent value="card" className="mt-4">
                        {isLoadingImages ? (
                          <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 text-teal-600 dark:text-teal-400 animate-spin mb-4" />
                            <p className="text-teal-700 dark:text-teal-300">Generating trait visualizations...</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            {traits.map((trait, idx) => (
                              <div
                                key={idx}
                                className="bg-teal-50 dark:bg-gray-700 rounded-md border border-teal-100 dark:border-gray-600 overflow-hidden"
                              >
                                <div className="flex flex-col sm:flex-row">
                                  <div className="relative h-40 sm:w-1/3 bg-gray-100 dark:bg-gray-800">
                                    <Image
                                      src={
                                        traitImages[trait] ||
                                        `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(trait)}`
                                      }
                                      alt={`${trait} visualization`}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="p-4 sm:w-2/3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                                        {getTraitIcon(trait)}
                                      </div>
                                      <h3 className="text-lg font-semibold text-teal-800 dark:text-teal-200">
                                        {trait}
                                      </h3>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                      {trait === "Confident" &&
                                        "Shows strong self-assurance and belief in their abilities."}
                                      {trait === "Creative" &&
                                        "Demonstrates originality and imagination in their thinking."}
                                      {trait === "Emotional" &&
                                        "Expresses feelings openly and responds deeply to experiences."}
                                      {trait === "Analytical" &&
                                        "Approaches problems with logical and methodical thinking."}
                                      {trait === "Extroverted" &&
                                        "Gains energy from social interactions and external stimulation."}
                                      {trait === "Introverted" &&
                                        "Prefers solitude and internal reflection for recharging."}
                                      {![
                                        "Confident",
                                        "Creative",
                                        "Emotional",
                                        "Analytical",
                                        "Extroverted",
                                        "Introverted",
                                      ].includes(trait) &&
                                        "This personality trait influences how they interact with the world around them."}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                      <TabsContent value="detailed" className="mt-4">
                        <div className="bg-teal-50 dark:bg-gray-700 p-4 rounded-md border border-teal-100 dark:border-gray-600">
                          {isLoadingDetails ? (
                            <div className="flex flex-col items-center justify-center py-8">
                              <Loader2 className="h-8 w-8 text-teal-600 dark:text-teal-400 animate-spin mb-4" />
                              <p className="text-teal-700 dark:text-teal-300">Generating detailed analysis...</p>
                            </div>
                          ) : detailedAnalysis ? (
                            <div className="prose dark:prose-invert max-w-none">
                              <h3 className="text-xl font-semibold text-teal-800 dark:text-teal-300 mb-3">
                                Personality Profile
                              </h3>
                              <div className="text-gray-700 dark:text-gray-200 space-y-4">
                                {detailedAnalysis.split("\n\n").map((paragraph, idx) => (
                                  <p key={idx}>{paragraph}</p>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-teal-700 dark:text-teal-300">
                                Click "Analyze Handwriting" to generate a detailed personality profile
                              </p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Upload and analyze your handwriting to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-teal-50 dark:bg-gray-800 transition-colors duration-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our advanced AI analyzes various aspects of your handwriting to reveal personality traits.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Upload Sample",
                description: "Take a clear photo of your handwriting on unlined paper and upload it to our system.",
                icon: <Upload className="h-8 w-8 text-teal-600 dark:text-teal-400" />,
              },
              {
                title: "AI Analysis",
                description:
                  "Our advanced algorithms analyze pressure, spacing, slant, size, and other handwriting characteristics.",
                icon: <Brain className="h-8 w-8 text-teal-600 dark:text-teal-400" />,
              },
              {
                title: "Discover Traits",
                description: "Receive detailed insights about your personality, emotions, and thinking patterns.",
                icon: <Sparkles className="h-8 w-8 text-teal-600 dark:text-teal-400" />,
              },
            ].map((feature, idx) => (
              <Card key={idx} className="border-teal-100 dark:border-gray-700 dark:bg-gray-800">
                <CardContent className="pt-6">
                  <div className="rounded-full bg-teal-100 dark:bg-gray-700 p-3 w-fit mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2 dark:text-white">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trait Visualization Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Common Personality Traits</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Explore how different personality traits manifest in handwriting patterns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                trait: "Confident",
                description: "Strong pressure, large size, and rightward slant indicate confidence and assertiveness.",
                icon: <User className="h-10 w-10 text-teal-600 dark:text-teal-400" />,
                image: "/placeholder.svg?height=200&width=200&text=Confident",
              },
              {
                trait: "Creative",
                description: "Unusual letter forms, varying baselines, and artistic flourishes suggest creativity.",
                icon: <Lightbulb className="h-10 w-10 text-amber-500 dark:text-amber-400" />,
                image: "/placeholder.svg?height=200&width=200&text=Creative",
              },
              {
                trait: "Extroverted",
                description: "Large writing, rightward slant, and open letter forms indicate an outgoing personality.",
                icon: <Users className="h-10 w-10 text-blue-500 dark:text-blue-400" />,
                image: "/placeholder.svg?height=200&width=200&text=Extroverted",
              },
              {
                trait: "Introverted",
                description: "Small writing, leftward or vertical slant, and closed letter forms suggest introversion.",
                icon: <User className="h-10 w-10 text-purple-500 dark:text-purple-400" />,
                image: "/placeholder.svg?height=200&width=200&text=Introverted",
              },
              {
                trait: "Emotional",
                description:
                  "Varying pressure, irregular spacing, and elaborate loops indicate emotional expressiveness.",
                icon: <Heart className="h-10 w-10 text-red-500 dark:text-red-400" />,
                image: "/placeholder.svg?height=200&width=200&text=Emotional",
              },
              {
                trait: "Analytical",
                description: "Precise letter forms, consistent spacing, and sharp angles suggest analytical thinking.",
                icon: <Brain className="h-10 w-10 text-indigo-500 dark:text-indigo-400" />,
                image: "/placeholder.svg?height=200&width=200&text=Analytical",
              },
            ].map((item, idx) => (
              <Card key={idx} className="border-teal-100 dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
                <div className="relative h-40 bg-gray-100 dark:bg-gray-700">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={`${item.trait} visualization`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">{item.icon}</div>
                      {item.trait}
                    </h3>
                  </div>
                </div>
                <CardContent className="pt-4">
                  <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 dark:bg-gray-800 transition-colors duration-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">What Users Say</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover how our handwriting analysis has helped others gain insights.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "I was amazed at how accurate the analysis was. It revealed aspects of my personality I wasn't fully aware of.",
                author: "Sarah J.",
                role: "Teacher",
              },
              {
                quote:
                  "The insights about my creative thinking patterns were spot on. This tool helped me understand my approach to problem-solving.",
                author: "Michael T.",
                role: "Designer",
              },
              {
                quote:
                  "I use this with my psychology students to demonstrate the connection between handwriting and personality. It's a fantastic teaching tool.",
                author: "Dr. Lisa Chen",
                role: "Psychology Professor",
              },
            ].map((testimonial, idx) => (
              <Card key={idx} className="border-teal-100 dark:border-gray-700 dark:bg-gray-800">
                <CardContent className="pt-6">
                  <div className="flex flex-col h-full">
                    <div className="text-lg italic mb-4 flex-grow dark:text-gray-300">"{testimonial.quote}"</div>
                    <div>
                      <p className="font-semibold dark:text-white">{testimonial.author}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Brain className="mr-2 h-5 w-5 text-teal-400" /> Handwriting Analyzer
            </h3>
            <p className="text-gray-400">
              Discover the hidden aspects of your personality through the science of graphology.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#analyzer-section" className="text-gray-400 hover:text-white transition-colors">
                  Analyzer
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Stay Connected</h4>
            <p className="text-gray-400 mb-4">Subscribe to our newsletter for the latest updates and insights.</p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="px-3 py-2 bg-gray-800 text-white rounded-l-md focus:outline-none focus:ring-1 focus:ring-teal-500 w-full"
              />
              <Button className="rounded-l-none bg-teal-600 hover:bg-teal-700">Subscribe</Button>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Handwriting Personality Analyzer. All rights reserved.
        </div>
      </footer>
    </main>
  )
}
