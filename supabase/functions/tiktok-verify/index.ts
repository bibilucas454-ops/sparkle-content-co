import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const htmlHeader = {
  ...corsHeaders,
  'Content-Type': 'text/html; charset=utf-8',
}

const plainHeader = {
  ...corsHeaders,
  'Content-Type': 'text/plain; charset=utf-8',
}

serve(async (req) => {
  const url = new URL(req.url)
  const path = url.pathname.replace('/tiktok-verify', '') // Handle both function name and subpaths

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Route: TikTok Verification File
  if (path.includes('tiktokSFwfoa7QmTvcTqcuUwk3Mkg9snzohUg5.txt')) {
    return new Response("tiktokSFwfoa7QmTvcTqcuUwk3Mkg9snzohUg5", { headers: plainHeader })
  }

  // Route: Privacy Policy
  if (path.includes('privacy')) {
    return new Response(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <title>Política de Privacidade - CreatorOS</title>
          <style>
            body { font-family: -apple-system, blinkmacsystemfont, "Segoe UI", roboto, helvetica, arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }
            h1 { font-size: 2.5rem; margin-bottom: 20px; color: #111; }
            h2 { font-size: 1.5rem; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
            section { margin-bottom: 20px; }
            ul { padding-left: 20px; }
          </style>
      </head>
      <body>
          <h1>Política de Privacidade</h1>
          <p>Bem-vindo à Política de Privacidade do CreatorOS. Nossa prioridade é a segurança e a transparência em relação aos seus dados.</p>
          
          <section>
            <h2>1. Introdução</h2>
            <p>O CreatorOS utiliza as APIs oficiais da Meta (Facebook e Instagram) e TikTok para conectar contas de redes sociais de forma segura e transparente.</p>
          </section>

          <section>
            <h2>2. Dados coletados</h2>
            <p>Coletamos apenas os dados estritamente necessários para autenticação e publicação: informações de perfil público, tokens de acesso OAuth e metadados de mídia.</p>
          </section>

          <section>
            <h2>3. Uso das informações</h2>
            <p>Os dados são usados exclusivamente para a operação da plataforma CreatorOS. Para o TikTok, utilizamos os escopos de publicação para permitir que você envie vídeos e fotos diretamente para o seu perfil.</p>
          </section>

          <section>
            <h2>4. Exclusão de dados</h2>
            <p>Você pode revogar o acesso do CreatorOS a qualquer momento. Ao desconectar uma conta, todos os tokens são removidos permanentemente.</p>
          </section>

          <p>Contato: ibibiano041@gmail.com</p>
          <p><small>&copy; 2026 CreatorOS. Última atualização: Março 2026</small></p>
      </body>
      </html>
    `, { headers: htmlHeader })
  }

  // Route: Terms of Service
  if (path.includes('terms')) {
    return new Response(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <title>Termos de Uso - CreatorOS</title>
          <style>
            body { font-family: -apple-system, blinkmacsystemfont, "Segoe UI", roboto, helvetica, arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }
            h1 { font-size: 2.5rem; margin-bottom: 20px; color: #111; }
            h2 { font-size: 1.5rem; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
          </style>
      </head>
      <body>
          <h1>Termos de Uso</h1>
          <p>Ao acessar e utilizar o CreatorOS AI, você concorda em cumprir estes Termos de Uso.</p>
          
          <h2>1. Uso da Plataforma</h2>
          <p>O CreatorOS AI é uma ferramenta voltada para auxílio na criação de conteúdo. O usuário é o único responsável pelo conteúdo publicado.</p>

          <h2>2. Integrações do TikTok</h2>
          <p>Ao conectar sua conta TikTok, você concorda em cumprir os Termos de Serviço do TikTok e as diretrizes da plataforma.</p>

          <p>Contato: ibibiano041@gmail.com</p>
          <p><small>&copy; 2026 CreatorOS. Última atualização: Março 2026</small></p>
      </body>
      </html>
    `, { headers: htmlHeader })
  }

  // Default: Verification Code (safest fallback for TikTok crawler)
  return new Response("tiktokSFwfoa7QmTvcTqcuUwk3Mkg9snzohUg5", { headers: plainHeader })
})
