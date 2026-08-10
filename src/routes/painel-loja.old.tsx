import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/painel-loja/old')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/painel-loja/old"!</div>
}
