import { ReactNode } from 'react'

import PwaPromptCapture from '@/components/pwa/PwaPromptCapture'
export default async function UsuariosLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ comercioId: string }>
}) {
  const { comercioId } = await params

  return (
    <>
      <link
        rel="manifest"
        href={`/api/pwa/manifest/${comercioId}`}
      />

      <meta
        name="theme-color"
        content="#111827"
      />

      <meta
        name="mobile-web-app-capable"
        content="yes"
      />

      <meta
        name="apple-mobile-web-app-capable"
        content="yes"
      />

      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="default"
      />

      <PwaPromptCapture />

{children}
    </>
  )
}