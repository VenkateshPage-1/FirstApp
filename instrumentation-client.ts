import * as Sentry from '@sentry/nextjs'

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,
  debug: false,
  ignoreErrors: [
    'Unknown root exit status',
    /Unknown root exit status/,
    'TypeError: Failed to fetch',
    'TypeError: NetworkError when attempting to fetch resource',
    'TypeError: Load failed',
  ],
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
