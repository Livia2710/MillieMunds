import { auth } from './auth'

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (!req.auth && pathname !== '/login') {
    return Response.redirect(new URL('/login', req.url))
  }

  // rota /mestre: só MASTER pode acessar
  // a verificação real é feita na própria page via getMasterPageData(),
  // mas aqui bloqueamos acesso sem sessão ativa
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|assets).*)']
}