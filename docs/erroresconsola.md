:3004/presenter/new?type=quiz:1  GET http://localhost:3004/presenter/new?type=quiz 500 (Internal Server Error)
index.js:618 Uncaught ModuleBuildError: Module build failed (from ./node_modules/.pnpm/next@14.1.0_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  × the name `useState` is defined multiple times
     ╭─[/Users/santiagobalosky/autosparkgames/app/presenter/new/page.tsx:1:1]
   1 │ "use client"
   2 │ 
   3 │ import { useCallback, useEffect, useMemo, useState } from "react"
     ·                                           ────┬───
     ·                                               ╰── previous definition of `useState` here
   4 │ import { useRouter, useSearchParams } from "next/navigation"
   5 │ import { Input } from "@/components/ui/input"
   6 │ import { Label } from "@/components/ui/label"
   7 │ import { Button } from "@/components/ui/button"
   8 │ import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
   9 │ import { useAuth } from "@/contexts/AuthContext"
  10 │ import { createPresentation, addSlide } from "@/lib/firebase/helpers/presentations"
  11 │ import { SlideType } from "@/lib/types/presentation"
  12 │ import { useGameSession } from "@/lib/hooks/useSocket"
  13 │ 
  14 │ export default function NewQuizPage() {
  15 │   const router = useRouter()
  16 │   const search = useSearchParams()
  17 │   const { user } = useAuth()
  18 │   const { createSession } = useGameSession()
  19 │ 
  20 │   const [question, setQuestion] = useState<string>("¿Cuál es la opción correcta?")
  21 │   const [options, setOptions] = useState<string[]>(["A", "B", "C", "D"])
  22 │   const [time, setTime] = useState<number>(20)
  23 │   const disabled = useMemo(() => options.some(o => o.trim().length === 0) || question.trim().length === 0, [options, question])
  24 │ 
  25 │   const handleOptionChange = useCallback((idx: number, value: string) => {
  26 │     setOptions(prev => prev.map((o, i) => (i === idx ? value : o)))
  27 │   }, [])
  28 │ 
  29 │   const handlePresentNow = useCallback(async () => {
  30 │     try {
  31 │       if (!user?.uid) {
  32 │         alert("Inicia sesión para continuar")
  33 │         return
  34 │       }
  35 │       const presentationId = await createPresentation(user.uid, "Quiz rápido", "Creado desde asistente rápido")
  36 │       await addSlide(presentationId, {
  37 │         type: SlideType.TRIVIA,
  38 │         title: "Pregunta 1",
  39 │         question,
  40 │         options: options.map((t, i) => ({ id: String(i), text: t })),
  41 │         correctAnswer: "0",
  42 │         points: 100,
  43 │         difficulty: "easy",
  44 │         timeLimit: time,
  45 │         order: 0,
  46 │         id: "temp"
  47 │       } as any)
  48 │ 
  49 │       const data: unknown = await createSession(presentationId)
  50 │       const code = (data as { session?: { code?: string } })?.session?.code
  51 │       if (!code) throw new Error("No se pudo obtener el código de sesión")
  52 │       const projectorUrl = `${window.location.origin}/session/${code}/projector`
  53 │       window.open(projectorUrl, "_blank", "noopener,noreferrer")
  54 │       router.replace(`/presenter/session/${code}`)
  55 │     } catch (error) {
  56 │       // eslint-disable-next-line no-console
  57 │       console.error('[Service] Error Presentar ahora', error)
  58 │       alert("No se pudo presentar. Intenta nuevamente.")
  59 │     }
  60 │   }, [user?.uid, question, options, time, createSession, router])
  61 │ 
  62 │   const handleSaveDraft = useCallback(async () => {
  63 │     try {
  64 │       if (!user?.uid) {
  65 │         alert("Inicia sesión para continuar")
  66 │         return
  67 │       }
  68 │       const presentationId = await createPresentation(user.uid, "Quiz rápido (borrador)")
  69 │       await addSlide(presentationId, {
  70 │         type: SlideType.TRIVIA,
  71 │         title: "Pregunta 1",
  72 │         question,
  73 │         options: options.map((t, i) => ({ id: String(i), text: t })),
  74 │         correctAnswer: "0",
  75 │         points: 100,
  76 │         difficulty: "easy",
  77 │         timeLimit: time,
  78 │         order: 0,
  79 │         id: "temp"
  80 │       } as any)
  81 │       router.replace(`/presenter/edit/${presentationId}`)
  82 │     } catch (error) {
  83 │       // eslint-disable-next-line no-console
  84 │       console.error('[Service] Error guardando borrador', error)
  85 │       alert("No se pudo guardar. Intenta nuevamente.")
  86 │     }
  87 │   }, [user?.uid, question, options, time, router])
  88 │ 
  89 │   useEffect(() => {
  90 │     const type = search.get('type')
  91 │     if (type && type !== 'quiz') {
  92 │       // eslint-disable-next-line no-console
  93 │       console.error('[NewQuiz] tipo no soportado:', type)
  94 │     }
  95 │   }, [search])
  96 │ 
  97 │   return (
  98 │     <div className="container mx-auto px-4 py-10">
  99 │       <div className="max-w-3xl mx-auto">
 100 │         <Card className="rounded-2xl">
 101 │           <CardHeader>
 102 │             <CardTitle>Quiz rápido (1 pregunta)</CardTitle>
 103 │             <CardDescription>Completa los campos y presenta en un clic</CardDescription>
 104 │           </CardHeader>
 105 │           <CardContent className="grid gap-4">
 106 │             <div className="grid gap-2">
 107 │               <Label htmlFor="q">Pregunta</Label>
 108 │               <Input id="q" aria-label="Pregunta" value={question} onChange={(e) => setQuestion(e.target.value)} className="rounded-xl" placeholder="Escribe la pregunta" />
 109 │             </div>
 110 │             <div className="grid gap-2">
 111 │               <Label>Opciones</Label>
 112 │               {options.map((opt, i) => (
 113 │                 <Input key={i} aria-label={`Opción ${i + 1}`} value={opt} onChange={(e) => handleOptionChange(i, e.target.value)} className="rounded-xl" placeholder={`Opción ${i + 1}`} />
 114 │               ))}
 115 │             </div>
 116 │             <div className="grid gap-2">
 117 │               <Label htmlFor="t">Tiempo</Label>
 118 │               <select id="t" aria-label="Tiempo por pregunta" className="h-11 rounded-xl border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={time} onChange={(e) => setTime(Number(e.target.value))}>
 119 │                 <option value={10}>10 segundos</option>
 120 │                 <option value={20}>20 segundos</option>
 121 │                 <option value={30}>30 segundos</option>
 122 │               </select>
 123 │             </div>
 124 │ 
 125 │             <div className="flex items-center gap-2 pt-2">
 126 │               <Button onClick={handlePresentNow} aria-label="Presentar ahora" disabled={disabled} className="rounded-xl">Presentar ahora</Button>
 127 │               <Button variant="outline" onClick={handleSaveDraft} aria-label="Guardar como borrador" className="rounded-xl">Guardar como borrador</Button>
 128 │             </div>
 129 │           </CardContent>
 130 │         </Card>
 131 │       </div>
 132 │     </div>
 133 │   )
 134 │ }
 135 │ 
 136 │ 'use client'
 137 │ 
 138 │ import { useState } from 'react'
     ·          ────┬───
     ·              ╰── `useState` redefined here
 139 │ import { useRouter } from 'next/navigation'
 140 │ import { Gamepad2, Users, Trophy, Palette, Zap, ArrowRight } from 'lucide-react'
     ╰────

  × the name `useRouter` is defined multiple times
     ╭─[/Users/santiagobalosky/autosparkgames/app/presenter/new/page.tsx:1:1]
   1 │ "use client"
   2 │ 
   3 │ import { useCallback, useEffect, useMemo, useState } from "react"
   4 │ import { useRouter, useSearchParams } from "next/navigation"
     ·          ────┬────
     ·              ╰── previous definition of `useRouter` here
   5 │ import { Input } from "@/components/ui/input"
   6 │ import { Label } from "@/components/ui/label"
   7 │ import { Button } from "@/components/ui/button"
   8 │ import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
   9 │ import { useAuth } from "@/contexts/AuthContext"
  10 │ import { createPresentation, addSlide } from "@/lib/firebase/helpers/presentations"
  11 │ import { SlideType } from "@/lib/types/presentation"
  12 │ import { useGameSession } from "@/lib/hooks/useSocket"
  13 │ 
  14 │ export default function NewQuizPage() {
  15 │   const router = useRouter()
  16 │   const search = useSearchParams()
  17 │   const { user } = useAuth()
  18 │   const { createSession } = useGameSession()
  19 │ 
  20 │   const [question, setQuestion] = useState<string>("¿Cuál es la opción correcta?")
  21 │   const [options, setOptions] = useState<string[]>(["A", "B", "C", "D"])
  22 │   const [time, setTime] = useState<number>(20)
  23 │   const disabled = useMemo(() => options.some(o => o.trim().length === 0) || question.trim().length === 0, [options, question])
  24 │ 
  25 │   const handleOptionChange = useCallback((idx: number, value: string) => {
  26 │     setOptions(prev => prev.map((o, i) => (i === idx ? value : o)))
  27 │   }, [])
  28 │ 
  29 │   const handlePresentNow = useCallback(async () => {
  30 │     try {
  31 │       if (!user?.uid) {
  32 │         alert("Inicia sesión para continuar")
  33 │         return
  34 │       }
  35 │       const presentationId = await createPresentation(user.uid, "Quiz rápido", "Creado desde asistente rápido")
  36 │       await addSlide(presentationId, {
  37 │         type: SlideType.TRIVIA,
  38 │         title: "Pregunta 1",
  39 │         question,
  40 │         options: options.map((t, i) => ({ id: String(i), text: t })),
  41 │         correctAnswer: "0",
  42 │         points: 100,
  43 │         difficulty: "easy",
  44 │         timeLimit: time,
  45 │         order: 0,
  46 │         id: "temp"
  47 │       } as any)
  48 │ 
  49 │       const data: unknown = await createSession(presentationId)
  50 │       const code = (data as { session?: { code?: string } })?.session?.code
  51 │       if (!code) throw new Error("No se pudo obtener el código de sesión")
  52 │       const projectorUrl = `${window.location.origin}/session/${code}/projector`
  53 │       window.open(projectorUrl, "_blank", "noopener,noreferrer")
  54 │       router.replace(`/presenter/session/${code}`)
  55 │     } catch (error) {
  56 │       // eslint-disable-next-line no-console
  57 │       console.error('[Service] Error Presentar ahora', error)
  58 │       alert("No se pudo presentar. Intenta nuevamente.")
  59 │     }
  60 │   }, [user?.uid, question, options, time, createSession, router])
  61 │ 
  62 │   const handleSaveDraft = useCallback(async () => {
  63 │     try {
  64 │       if (!user?.uid) {
  65 │         alert("Inicia sesión para continuar")
  66 │         return
  67 │       }
  68 │       const presentationId = await createPresentation(user.uid, "Quiz rápido (borrador)")
  69 │       await addSlide(presentationId, {
  70 │         type: SlideType.TRIVIA,
  71 │         title: "Pregunta 1",
  72 │         question,
  73 │         options: options.map((t, i) => ({ id: String(i), text: t })),
  74 │         correctAnswer: "0",
  75 │         points: 100,
  76 │         difficulty: "easy",
  77 │         timeLimit: time,
  78 │         order: 0,
  79 │         id: "temp"
  80 │       } as any)
  81 │       router.replace(`/presenter/edit/${presentationId}`)
  82 │     } catch (error) {
  83 │       // eslint-disable-next-line no-console
  84 │       console.error('[Service] Error guardando borrador', error)
  85 │       alert("No se pudo guardar. Intenta nuevamente.")
  86 │     }
  87 │   }, [user?.uid, question, options, time, router])
  88 │ 
  89 │   useEffect(() => {
  90 │     const type = search.get('type')
  91 │     if (type && type !== 'quiz') {
  92 │       // eslint-disable-next-line no-console
  93 │       console.error('[NewQuiz] tipo no soportado:', type)
  94 │     }
  95 │   }, [search])
  96 │ 
  97 │   return (
  98 │     <div className="container mx-auto px-4 py-10">
  99 │       <div className="max-w-3xl mx-auto">
 100 │         <Card className="rounded-2xl">
 101 │           <CardHeader>
 102 │             <CardTitle>Quiz rápido (1 pregunta)</CardTitle>
 103 │             <CardDescription>Completa los campos y presenta en un clic</CardDescription>
 104 │           </CardHeader>
 105 │           <CardContent className="grid gap-4">
 106 │             <div className="grid gap-2">
 107 │               <Label htmlFor="q">Pregunta</Label>
 108 │               <Input id="q" aria-label="Pregunta" value={question} onChange={(e) => setQuestion(e.target.value)} className="rounded-xl" placeholder="Escribe la pregunta" />
 109 │             </div>
 110 │             <div className="grid gap-2">
 111 │               <Label>Opciones</Label>
 112 │               {options.map((opt, i) => (
 113 │                 <Input key={i} aria-label={`Opción ${i + 1}`} value={opt} onChange={(e) => handleOptionChange(i, e.target.value)} className="rounded-xl" placeholder={`Opción ${i + 1}`} />
 114 │               ))}
 115 │             </div>
 116 │             <div className="grid gap-2">
 117 │               <Label htmlFor="t">Tiempo</Label>
 118 │               <select id="t" aria-label="Tiempo por pregunta" className="h-11 rounded-xl border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={time} onChange={(e) => setTime(Number(e.target.value))}>
 119 │                 <option value={10}>10 segundos</option>
 120 │                 <option value={20}>20 segundos</option>
 121 │                 <option value={30}>30 segundos</option>
 122 │               </select>
 123 │             </div>
 124 │ 
 125 │             <div className="flex items-center gap-2 pt-2">
 126 │               <Button onClick={handlePresentNow} aria-label="Presentar ahora" disabled={disabled} className="rounded-xl">Presentar ahora</Button>
 127 │               <Button variant="outline" onClick={handleSaveDraft} aria-label="Guardar como borrador" className="rounded-xl">Guardar como borrador</Button>
 128 │             </div>
 129 │           </CardContent>
 130 │         </Card>
 131 │       </div>
 132 │     </div>
 133 │   )
 134 │ }
 135 │ 
 136 │ 'use client'
 137 │ 
 138 │ import { useState } from 'react'
 139 │ import { useRouter } from 'next/navigation'
     ·          ────┬────
     ·              ╰── `useRouter` redefined here
 140 │ import { Gamepad2, Users, Trophy, Palette, Zap, ArrowRight } from 'lucide-react'
 141 │ 
 142 │ const gameTemplates = [
     ╰────

  × the name `default` is exported multiple times
     ╭─[/Users/santiagobalosky/autosparkgames/app/presenter/new/page.tsx:11:1]
  11 │     import { SlideType } from "@/lib/types/presentation"
  12 │     import { useGameSession } from "@/lib/hooks/useSocket"
  13 │     
  14 │ ╭─▶ export default function NewQuizPage() {
  15 │ │     const router = useRouter()
  16 │ │     const search = useSearchParams()
  17 │ │     const { user } = useAuth()
  18 │ │     const { createSession } = useGameSession()
  19 │ │   
  20 │ │     const [question, setQuestion] = useState<string>("¿Cuál es la opción correcta?")
  21 │ │     const [options, setOptions] = useState<string[]>(["A", "B", "C", "D"])
  22 │ │     const [time, setTime] = useState<number>(20)
  23 │ │     const disabled = useMemo(() => options.some(o => o.trim().length === 0) || question.trim().length === 0, [options, question])
  24 │ │   
  25 │ │     const handleOptionChange = useCallback((idx: number, value: string) => {
  26 │ │       setOptions(prev => prev.map((o, i) => (i === idx ? value : o)))
  27 │ │     }, [])
  28 │ │   
  29 │ │     const handlePresentNow = useCallback(async () => {
  30 │ │       try {
  31 │ │         if (!user?.uid) {
  32 │ │           alert("Inicia sesión para continuar")
  33 │ │           return
  34 │ │         }
  35 │ │         const presentationId = await createPresentation(user.uid, "Quiz rápido", "Creado desde asistente rápido")
  36 │ │         await addSlide(presentationId, {
  37 │ │           type: SlideType.TRIVIA,
  38 │ │           title: "Pregunta 1",
  39 │ │           question,
  40 │ │           options: options.map((t, i) => ({ id: String(i), text: t })),
  41 │ │           correctAnswer: "0",
  42 │ │           points: 100,
  43 │ │           difficulty: "easy",
  44 │ │           timeLimit: time,
  45 │ │           order: 0,
  46 │ │           id: "temp"
  47 │ │         } as any)
  48 │ │   
  49 │ │         const data: unknown = await createSession(presentationId)
  50 │ │         const code = (data as { session?: { code?: string } })?.session?.code
  51 │ │         if (!code) throw new Error("No se pudo obtener el código de sesión")
  52 │ │         const projectorUrl = `${window.location.origin}/session/${code}/projector`
  53 │ │         window.open(projectorUrl, "_blank", "noopener,noreferrer")
  54 │ │         router.replace(`/presenter/session/${code}`)
  55 │ │       } catch (error) {
  56 │ │         // eslint-disable-next-line no-console
  57 │ │         console.error('[Service] Error Presentar ahora', error)
  58 │ │         alert("No se pudo presentar. Intenta nuevamente.")
  59 │ │       }
  60 │ │     }, [user?.uid, question, options, time, createSession, router])
  61 │ │   
  62 │ │     const handleSaveDraft = useCallback(async () => {
  63 │ │       try {
  64 │ │         if (!user?.uid) {
  65 │ │           alert("Inicia sesión para continuar")
  66 │ │           return
  67 │ │         }
  68 │ │         const presentationId = await createPresentation(user.uid, "Quiz rápido (borrador)")
  69 │ │         await addSlide(presentationId, {
  70 │ │           type: SlideType.TRIVIA,
  71 │ │           title: "Pregunta 1",
  72 │ │           question,
  73 │ │           options: options.map((t, i) => ({ id: String(i), text: t })),
  74 │ │           correctAnswer: "0",
  75 │ │           points: 100,
  76 │ │           difficulty: "easy",
  77 │ │           timeLimit: time,
  78 │ │           order: 0,
  79 │ │           id: "temp"
  80 │ │         } as any)
  81 │ │         router.replace(`/presenter/edit/${presentationId}`)
  82 │ │       } catch (error) {
  83 │ │         // eslint-disable-next-line no-console
  84 │ │         console.error('[Service] Error guardando borrador', error)
  85 │ │         alert("No se pudo guardar. Intenta nuevamente.")
  86 │ │       }
  87 │ │     }, [user?.uid, question, options, time, router])
  88 │ │   
  89 │ │     useEffect(() => {
  90 │ │       const type = search.get('type')
  91 │ │       if (type && type !== 'quiz') {
  92 │ │         // eslint-disable-next-line no-console
  93 │ │         console.error('[NewQuiz] tipo no soportado:', type)
  94 │ │       }
  95 │ │     }, [search])
  96 │ │   
  97 │ │     return (
  98 │ │       <div className="container mx-auto px-4 py-10">
  99 │ │         <div className="max-w-3xl mx-auto">
 100 │ │           <Card className="rounded-2xl">
 101 │ │             <CardHeader>
 102 │ │               <CardTitle>Quiz rápido (1 pregunta)</CardTitle>
 103 │ │               <CardDescription>Completa los campos y presenta en un clic</CardDescription>
 104 │ │             </CardHeader>
 105 │ │             <CardContent className="grid gap-4">
 106 │ │               <div className="grid gap-2">
 107 │ │                 <Label htmlFor="q">Pregunta</Label>
 108 │ │                 <Input id="q" aria-label="Pregunta" value={question} onChange={(e) => setQuestion(e.target.value)} className="rounded-xl" placeholder="Escribe la pregunta" />
 109 │ │               </div>
 110 │ │               <div className="grid gap-2">
 111 │ │                 <Label>Opciones</Label>
 112 │ │                 {options.map((opt, i) => (
 113 │ │                   <Input key={i} aria-label={`Opción ${i + 1}`} value={opt} onChange={(e) => handleOptionChange(i, e.target.value)} className="rounded-xl" placeholder={`Opción ${i + 1}`} />
 114 │ │                 ))}
 115 │ │               </div>
 116 │ │               <div className="grid gap-2">
 117 │ │                 <Label htmlFor="t">Tiempo</Label>
 118 │ │                 <select id="t" aria-label="Tiempo por pregunta" className="h-11 rounded-xl border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={time} onChange={(e) => setTime(Number(e.target.value))}>
 119 │ │                   <option value={10}>10 segundos</option>
 120 │ │                   <option value={20}>20 segundos</option>
 121 │ │                   <option value={30}>30 segundos</option>
 122 │ │                 </select>
 123 │ │               </div>
 124 │ │   
 125 │ │               <div className="flex items-center gap-2 pt-2">
 126 │ │                 <Button onClick={handlePresentNow} aria-label="Presentar ahora" disabled={disabled} className="rounded-xl">Presentar ahora</Button>
 127 │ │                 <Button variant="outline" onClick={handleSaveDraft} aria-label="Guardar como borrador" className="rounded-xl">Guardar como borrador</Button>
 128 │ │               </div>
 129 │ │             </CardContent>
 130 │ │           </Card>
 131 │ │         </div>
 132 │ │       </div>
 133 │ │     )
 134 │ ├─▶ }
     · ╰──── previous exported here
 135 │     
 136 │     'use client'
 137 │     
 138 │     import { useState } from 'react'
 139 │     import { useRouter } from 'next/navigation'
 140 │     import { Gamepad2, Users, Trophy, Palette, Zap, ArrowRight } from 'lucide-react'
 141 │     
 142 │     const gameTemplates = [
 143 │       {
 144 │         id: 'trivia',
 145 │         name: 'Trivia Rápida',
 146 │         description: 'Preguntas y respuestas interactivas',
 147 │         icon: Trophy,
 148 │         color: '#3b82f6',
 149 │         bgColor: '#dbeafe',
 150 │         time: '2 min'
 151 │       },
 152 │       {
 153 │         id: 'pictionary',
 154 │         name: 'Pictionary',
 155 │         description: 'Dibuja y adivina en tiempo real',
 156 │         icon: Palette,
 157 │         color: '#10b981',
 158 │         bgColor: '#d1fae5',
 159 │         time: '3 min'
 160 │       },
 161 │       {
 162 │         id: 'bingo',
 163 │         name: 'Bingo Interactivo',
 164 │         description: 'Bingo con números aleatorios',
 165 │         icon: Gamepad2,
 166 │         color: '#8b5cf6',
 167 │         bgColor: '#ede9fe',
 168 │         time: '1 min'
 169 │       }
 170 │     ]
 171 │     
 172 │ ╭─▶ export default function QuickCreatePage() {
 173 │ │     const [selectedTemplate, setSelectedTemplate] = useState('')
 174 │ │     const [sessionName, setSessionName] = useState('')
 175 │ │     const [isCreating, setIsCreating] = useState(false)
 176 │ │     const router = useRouter()
 177 │ │   
 178 │ │     const handleQuickCreate = async () => {
 179 │ │       if (!selectedTemplate || !sessionName.trim()) return
 180 │ │   
 181 │ │       setIsCreating(true)
 182 │ │       
 183 │ │       // Simular creación
 184 │ │       setTimeout(() => {
 185 │ │         const sessionCode = Math.floor(100000 + Math.random() * 900000).toString()
 186 │ │         alert(`¡Sesión creada! Código: ${sessionCode}`)
 187 │ │         setIsCreating(false)
 188 │ │         router.push('/presenter')
 189 │ │       }, 1500)
 190 │ │     }
 191 │ │   
 192 │ │     const styles = {
 193 │ │       container: {
 194 │ │         minHeight: '100vh',
 195 │ │         background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
 196 │ │         padding: '40px 20px',
 197 │ │         fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
 198 │ │       },
 199 │ │       wrapper: {
 200 │ │         maxWidth: '800px',
 201 │ │         margin: '0 auto'
 202 │ │       },
 203 │ │       header: {
 204 │ │         textAlign: 'center' as const,
 205 │ │         marginBottom: '40px'
 206 │ │       },
 207 │ │       title: {
 208 │ │         fontSize: '40px',
 209 │ │         fontWeight: '800',
 210 │ │         color: 'white',
 211 │ │         marginBottom: '12px'
 212 │ │       },
 213 │ │       subtitle: {
 214 │ │         fontSize: '18px',
 215 │ │         color: 'rgba(255, 255, 255, 0.9)'
 216 │ │       },
 217 │ │       form: {
 218 │ │         background: 'rgba(255, 255, 255, 0.95)',
 219 │ │         borderRadius: '16px',
 220 │ │         padding: '32px',
 221 │ │         boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
 222 │ │       },
 223 │ │       label: {
 224 │ │         display: 'block',
 225 │ │         fontSize: '14px',
 226 │ │         fontWeight: '600',
 227 │ │         color: '#374151',
 228 │ │         marginBottom: '8px'
 229 │ │       },
 230 │ │       input: {
 231 │ │         width: '100%',
 232 │ │         padding: '12px 16px',
 233 │ │         fontSize: '16px',
 234 │ │         border: '2px solid #e5e7eb',
 235 │ │         borderRadius: '8px',
 236 │ │         marginBottom: '24px',
 237 │ │         transition: 'border-color 0.2s',
 238 │ │         outline: 'none'
 239 │ │       },
 240 │ │       templatesGrid: {
 241 │ │         display: 'grid',
 242 │ │         gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
 243 │ │         gap: '16px',
 244 │ │         marginBottom: '32px'
 245 │ │       },
 246 │ │       templateCard: {
 247 │ │         padding: '20px',
 248 │ │         borderRadius: '12px',
 249 │ │         border: '2px solid #e5e7eb',
 250 │ │         cursor: 'pointer',
 251 │ │         transition: 'all 0.2s',
 252 │ │         textAlign: 'center' as const
 253 │ │       },
 254 │ │       templateCardSelected: {
 255 │ │         borderColor: '#8b5cf6',
 256 │ │         background: '#f3f4f6'
 257 │ │       },
 258 │ │       templateIcon: {
 259 │ │         width: '48px',
 260 │ │         height: '48px',
 261 │ │         margin: '0 auto 12px',
 262 │ │         borderRadius: '8px',
 263 │ │         display: 'flex',
 264 │ │         alignItems: 'center',
 265 │ │         justifyContent: 'center'
 266 │ │       },
 267 │ │       templateName: {
 268 │ │         fontSize: '16px',
 269 │ │         fontWeight: '600',
 270 │ │         color: '#1f2937',
 271 │ │         marginBottom: '4px'
 272 │ │       },
 273 │ │       templateDescription: {
 274 │ │         fontSize: '13px',
 275 │ │         color: '#6b7280',
 276 │ │         marginBottom: '8px'
 277 │ │       },
 278 │ │       templateTime: {
 279 │ │         display: 'inline-block',
 280 │ │         padding: '2px 8px',
 281 │ │         background: '#f3f4f6',
 282 │ │         borderRadius: '4px',
 283 │ │         fontSize: '12px',
 284 │ │         color: '#6b7280'
 285 │ │       },
 286 │ │       createButton: {
 287 │ │         width: '100%',
 288 │ │         padding: '14px',
 289 │ │         background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
 290 │ │         color: 'white',
 291 │ │         border: 'none',
 292 │ │         borderRadius: '8px',
 293 │ │         fontSize: '16px',
 294 │ │         fontWeight: '600',
 295 │ │         cursor: 'pointer',
 296 │ │         transition: 'opacity 0.2s',
 297 │ │         display: 'flex',
 298 │ │         alignItems: 'center',
 299 │ │         justifyContent: 'center',
 300 │ │         gap: '8px'
 301 │ │       },
 302 │ │       createButtonDisabled: {
 303 │ │         opacity: 0.5,
 304 │ │         cursor: 'not-allowed'
 305 │ │       },
 306 │ │       backButton: {
 307 │ │         display: 'inline-flex',
 308 │ │         alignItems: 'center',
 309 │ │         color: 'white',
 310 │ │         textDecoration: 'none',
 311 │ │         fontSize: '14px',
 312 │ │         marginBottom: '20px',
 313 │ │         opacity: 0.9,
 314 │ │         transition: 'opacity 0.2s'
 315 │ │       }
 316 │ │     }
 317 │ │   
 318 │ │     return (
 319 │ │       <div style={styles.container}>
 320 │ │         <div style={styles.wrapper}>
 321 │ │           <a href="/presenter" style={styles.backButton}>
 322 │ │             ← Volver al Dashboard
 323 │ │           </a>
 324 │ │           
 325 │ │           <div style={styles.header}>
 326 │ │             <h1 style={styles.title}>Crear Juego Rápido</h1>
 327 │ │             <p style={styles.subtitle}>Configura tu sesión en segundos</p>
 328 │ │           </div>
 329 │ │   
 330 │ │           <div style={styles.form}>
 331 │ │             <label style={styles.label}>Nombre de la Sesión</label>
 332 │ │             <input
 333 │ │               type="text"
 334 │ │               placeholder="Ej: Trivia de Matemáticas"
 335 │ │               value={sessionName}
 336 │ │               onChange={(e) => setSessionName(e.target.value)}
 337 │ │               style={styles.input}
 338 │ │             />
 339 │ │   
 340 │ │             <label style={styles.label}>Selecciona una Plantilla</label>
 341 │ │             <div style={styles.templatesGrid}>
 342 │ │               {gameTemplates.map((template) => {
 343 │ │                 const Icon = template.icon
 344 │ │                 const isSelected = selectedTemplate === template.id
 345 │ │                 
 346 │ │                 return (
 347 │ │                   <div
 348 │ │                     key={template.id}
 349 │ │                     onClick={() => setSelectedTemplate(template.id)}
 350 │ │                     style={{
 351 │ │                       ...styles.templateCard,
 352 │ │                       ...(isSelected ? styles.templateCardSelected : {})
 353 │ │                     }}
 354 │ │                   >
 355 │ │                     <div style={{
 356 │ │                       ...styles.templateIcon,
 357 │ │                       backgroundColor: template.bgColor
 358 │ │                     }}>
 359 │ │                       <Icon size={24} color={template.color} />
 360 │ │                     </div>
 361 │ │                     <div style={styles.templateName}>{template.name}</div>
 362 │ │                     <div style={styles.templateDescription}>{template.description}</div>
 363 │ │                     <span style={styles.templateTime}>{template.time}</span>
 364 │ │                   </div>
 365 │ │                 )
 366 │ │               })}
 367 │ │             </div>
 368 │ │   
 369 │ │             <button
 370 │ │               onClick={handleQuickCreate}
 371 │ │               disabled={!selectedTemplate || !sessionName.trim() || isCreating}
 372 │ │               style={{
 373 │ │                 ...styles.createButton,
 374 │ │                 ...(!selectedTemplate || !sessionName.trim() || isCreating ? styles.createButtonDisabled : {})
 375 │ │               }}
 376 │ │             >
 377 │ │               {isCreating ? (
 378 │ │                 <>Creando...</>
 379 │ │               ) : (
 380 │ │                 <>
 381 │ │                   <Zap size={20} />
 382 │ │                   Crear Sesión Ahora
 383 │ │                 </>
 384 │ │               )}
 385 │ │             </button>
 386 │ │           </div>
 387 │ │         </div>
 388 │ │       </div>
 389 │ │     )
 390 │ ├─▶ }
     · ╰──── exported more than once
     ╰────

Error: 
  ☞ Exported identifiers must be unique

  × The "use client" directive must be placed before other expressions. Move it to the top of the file to resolve this issue.
     ╭─[/Users/santiagobalosky/autosparkgames/app/presenter/new/page.tsx:133:1]
 133 │   )
 134 │ }
 135 │ 
 136 │ 'use client'
     · ────────────
 137 │ 
 138 │ import { useState } from 'react'
 139 │ import { useRouter } from 'next/navigation'
     ╰────

    at processResult (/Users/santiagobalosky/autosparkgames/node_modules/.pnpm/next@14.1.0_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/compiled/webpack/bundle5.js:28:398653)
    at <unknown> (/Users/santiagobalosky/autosparkgames/node_modules/.pnpm/next@14.1.0_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/compiled/webpack/bundle5.js:28:400370)
    at <unknown> (/Users/santiagobalosky/autosparkgames/node_modules/.pnpm/next@14.1.0_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/compiled/loader-runner/LoaderRunner.js:1:8645)
    at <unknown> (/Users/santiagobalosky/autosparkgames/node_modules/.pnpm/next@14.1.0_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/compiled/loader-runner/LoaderRunner.js:1:5019)
    at r.callback (/Users/santiagobalosky/autosparkgames/node_modules/.pnpm/next@14.1.0_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/compiled/loader-runner/LoaderRunner.js:1:4039)
getServerError @ client.js:441
eval @ index.js:618
setTimeout
hydrate @ index.js:606
await in hydrate
pageBootrap @ page-bootstrap.js:24
eval @ next-dev.js:25
Promise.then
eval @ next-dev.js:23
./node_modules/.pnpm/next@14.1.0_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/client/next-dev.js @ main.js:192
options.factory @ webpack.js:648
__webpack_require__ @ webpack.js:37
__webpack_exec__ @ main.js:1281
(anonymous) @ main.js:1282
webpackJsonpCallback @ webpack.js:1196
(anonymous) @ main.js:9
client.js:26 ./app/presenter/new/page.tsx
Error: 
  × the name `useState` is defined multiple times
     ╭─[/Users/santiagobalosky/autosparkgames/app/presenter/new/page.tsx:1:1]
   1 │ "use client"
   2 │ 
   3 │ import { useCallback, useEffect, useMemo, useState } from "react"
     ·                                           ────┬───
     ·                                               ╰── previous definition of `useState` here
   4 │ import { useRouter, useSearchParams } from "next/navigation"
   5 │ import { Input } from "@/components/ui/input"
   6 │ import { Label } from "@/components/ui/label"
   7 │ import { Button } from "@/components/ui/button"
   8 │ import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
   9 │ import { useAuth } from "@/contexts/AuthContext"
  10 │ import { createPresentation, addSlide } from "@/lib/firebase/helpers/presentations"
  11 │ import { SlideType } from "@/lib/types/presentation"
  12 │ import { useGameSession } from "@/lib/hooks/useSocket"
  13 │ 
  14 │ export default function NewQuizPage() {
  15 │   const router = useRouter()
  16 │   const search = useSearchParams()
  17 │   const { user } = useAuth()
  18 │   const { createSession } = useGameSession()
  19 │ 
  20 │   const [question, setQuestion] = useState<string>("¿Cuál es la opción correcta?")
  21 │   const [options, setOptions] = useState<string[]>(["A", "B", "C", "D"])
  22 │   const [time, setTime] = useState<number>(20)
  23 │   const disabled = useMemo(() => options.some(o => o.trim().length === 0) || question.trim().length === 0, [options, question])
  24 │ 
  25 │   const handleOptionChange = useCallback((idx: number, value: string) => {
  26 │     setOptions(prev => prev.map((o, i) => (i === idx ? value : o)))
  27 │   }, [])
  28 │ 
  29 │   const handlePresentNow = useCallback(async () => {
  30 │     try {
  31 │       if (!user?.uid) {
  32 │         alert("Inicia sesión para continuar")
  33 │         return
  34 │       }
  35 │       const presentationId = await createPresentation(user.uid, "Quiz rápido", "Creado desde asistente rápido")
  36 │       await addSlide(presentationId, {
  37 │         type: SlideType.TRIVIA,
  38 │         title: "Pregunta 1",
  39 │         question,
  40 │         options: options.map((t, i) => ({ id: String(i), text: t })),
  41 │         correctAnswer: "0",
  42 │         points: 100,
  43 │         difficulty: "easy",
  44 │         timeLimit: time,
  45 │         order: 0,
  46 │         id: "temp"
  47 │       } as any)
  48 │ 
  49 │       const data: unknown = await createSession(presentationId)
  50 │       const code = (data as { session?: { code?: string } })?.session?.code
  51 │       if (!code) throw new Error("No se pudo obtener el código de sesión")
  52 │       const projectorUrl = `${window.location.origin}/session/${code}/projector`
  53 │       window.open(projectorUrl, "_blank", "noopener,noreferrer")
  54 │       router.replace(`/presenter/session/${code}`)
  55 │     } catch (error) {
  56 │       // eslint-disable-next-line no-console
  57 │       console.error('[Service] Error Presentar ahora', error)
  58 │       alert("No se pudo presentar. Intenta nuevamente.")
  59 │     }
  60 │   }, [user?.uid, question, options, time, createSession, router])
  61 │ 
  62 │   const handleSaveDraft = useCallback(async () => {
  63 │     try {
  64 │       if (!user?.uid) {
  65 │         alert("Inicia sesión para continuar")
  66 │         return
  67 │       }
  68 │       const presentationId = await createPresentation(user.uid, "Quiz rápido (borrador)")
  69 │       await addSlide(presentationId, {
  70 │         type: SlideType.TRIVIA,
  71 │         title: "Pregunta 1",
  72 │         question,
  73 │         options: options.map((t, i) => ({ id: String(i), text: t })),
  74 │         correctAnswer: "0",
  75 │         points: 100,
  76 │         difficulty: "easy",
  77 │         timeLimit: time,
  78 │         order: 0,
  79 │         id: "temp"
  80 │       } as any)
  81 │       router.replace(`/presenter/edit/${presentationId}`)
  82 │     } catch (error) {
  83 │       // eslint-disable-next-line no-console
  84 │       console.error('[Service] Error guardando borrador', error)
  85 │       alert("No se pudo guardar. Intenta nuevamente.")
  86 │     }
  87 │   }, [user?.uid, question, options, time, router])
  88 │ 
  89 │   useEffect(() => {
  90 │     const type = search.get('type')
  91 │     if (type && type !== 'quiz') {
  92 │       // eslint-disable-next-line no-console
  93 │       console.error('[NewQuiz] tipo no soportado:', type)
  94 │     }
  95 │   }, [search])
  96 │ 
  97 │   return (
  98 │     <div className="container mx-auto px-4 py-10">
  99 │       <div className="max-w-3xl mx-auto">
 100 │         <Card className="rounded-2xl">
 101 │           <CardHeader>
 102 │             <CardTitle>Quiz rápido (1 pregunta)</CardTitle>
 103 │             <CardDescription>Completa los campos y presenta 
console.error @ client.js:26
window.console.error @ setup-hydration-warning.js:18
handleErrors @ hot-dev-client.js:142
processMessage @ hot-dev-client.js:216
eval @ hot-dev-client.js:55
handleMessage @ websocket.js:52
