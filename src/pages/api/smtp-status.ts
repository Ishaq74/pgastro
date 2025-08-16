import type { APIRoute } from 'astro';
import { testSmtpConnection } from '../../smtp';

export const GET: APIRoute = async () => {
  try {
    const result = await testSmtpConnection();
    
    // Structure de réponse enrichie avec messages français
    const response = {
      status: result.success ? 'connected' : 'error',
      success: result.success,
      message: result.message,
      detailedMessage: result.detailedMessage,
      errorCode: result.errorCode,
      config: result.config,
      timestamp: result.timestamp.toISOString(),
      diagnostics: {
        hasConfiguration: !!(result.config?.host && result.config?.user),
        hasAuthentication: result.config?.hasAuth || false,
        connectionTested: true,
        lastCheck: result.timestamp.toLocaleString('fr-FR')
      }
    };
    
    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur système inconnue';
    
    const errorResponse = {
      status: 'error',
      success: false,
      message: 'Erreur critique lors du test SMTP',
      detailedMessage: `Une erreur système s'est produite lors de la vérification de la configuration SMTP: ${errorMessage}. Vérifiez que le serveur est opérationnel et que la configuration est correcte.`,
      errorCode: 'SYSTEM_ERROR',
      timestamp: new Date().toISOString(),
      diagnostics: {
        hasConfiguration: false,
        hasAuthentication: false,
        connectionTested: false,
        lastCheck: new Date().toLocaleString('fr-FR'),
        systemError: true
      }
    };
    
    return new Response(JSON.stringify(errorResponse, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
};
