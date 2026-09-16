/**
 * Moodle SSO bridge.
 *
 * Uses the auth_userkey plugin on Moodle to generate a one-time login URL
 * for the currently authenticated ARTS user.
 *
 * MOODLE_WS_TOKEN must stay on the server; it is never sent to the client.
 */
import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * /api/moodle/login-url:
 *   get:
 *     summary: Get a one-time Moodle login URL
 *     description: |
 *       SSO bridge between ARTS and Moodle (auth_userkey plugin).
 *       The authenticated user's email is sent server-to-server to Moodle,
 *       which returns a single-use login URL for the client (e.g. a WebView).
 *       `MOODLE_WS_TOKEN` never leaves this backend.
 *     tags:
 *       - Moodle
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: One-time Moodle login URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - loginUrl
 *               properties:
 *                 loginUrl:
 *                   type: string
 *                   format: uri
 *                   example: http://localhost:8080/auth/userkey/login.php?key=XXXX
 *       400:
 *         description: Authenticated user has no email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: El usuario no tiene email registrado.
 *       401:
 *         description: Missing or invalid JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Moodle is not configured, or an internal error occurred
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               notConfigured:
 *                 value:
 *                   error: Moodle no está configurado en el servidor.
 *               internal:
 *                 value:
 *                   error: Error interno generando el acceso a Moodle.
 *       502:
 *         description: Moodle webservice did not return a login URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 moodle:
 *                   type: object
 *                   properties:
 *                     exception:
 *                       type: string
 *                     errorcode:
 *                       type: string
 *                     message:
 *                       type: string
 *             example:
 *               error: No se pudo generar la URL de login de Moodle.
 *               moodle:
 *                 exception: core\\exception\\required_capability_exception
 *                 errorcode: nopermissions
 *                 message: Sorry, but you do not currently have permissions to do that (Generate login user key).
 */
router.get('/login-url', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userEmail = req.user?.email as string | undefined;

    if (!userEmail) {
      return res.status(400).json({ error: 'El usuario no tiene email registrado.' });
    }

    const moodleBaseUrl = process.env.MOODLE_BASE_URL;
    const moodleWsToken = process.env.MOODLE_WS_TOKEN;

    if (!moodleBaseUrl || !moodleWsToken) {
      return res.status(500).json({ error: 'Moodle no está configurado en el servidor.' });
    }

    const url = new URL(`${moodleBaseUrl}/webservice/rest/server.php`);
    url.searchParams.set('wstoken', moodleWsToken);
    url.searchParams.set('wsfunction', 'auth_userkey_request_login_url');
    url.searchParams.set('moodlewsrestformat', 'json');
    url.searchParams.set('user[email]', userEmail);

    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = (await response.json()) as {
      loginurl?: string;
      exception?: string;
      errorcode?: string;
      message?: string;
    };

    if (data?.loginurl) {
      return res.json({ loginUrl: data.loginurl });
    }

    console.error('Moodle webservice error:', data);
    return res.status(502).json({
      error: 'No se pudo generar la URL de login de Moodle.',
      moodle: {
        exception: data.exception,
        errorcode: data.errorcode,
        message: data.message,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error llamando a Moodle:', message);
    return res.status(500).json({ error: 'Error interno generando el acceso a Moodle.' });
  }
});

export default router;
