import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Acesso Negado</CardTitle>
          <CardDescription className="text-center">
            Não tem permissões para aceder a esta página
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href="/tickets">
            <Button>Voltar aos Tickets</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
