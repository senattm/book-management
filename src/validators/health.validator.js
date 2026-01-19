const { z } = require("zod");
const { registry } = require("../config/openapi");

registry.registerPath({
    method: 'get',
    path: '/api/v1/health',
    tags: ['Health'],
    summary: 'Genel sağlık kontrolü',
    description: 'API\'nin çalışma durumunu ve temel sağlık metriklerini kontrol eder',
    responses: {
        200: {
            description: 'API sağlıklı ve çalışıyor',
            content: {
                'application/json': {
                    schema: z.object({
                        status: z.string().openapi({ example: 'ok' }),
                        timestamp: z.string().datetime(),
                        uptime: z.number().openapi({ example: 123456.789 }),
                        environment: z.string().openapi({ example: 'production' }),
                    }),
                },
            },
        },
        503: { description: 'Servis kullanılamıyor' },
    },
});

registry.registerPath({
    method: 'get',
    path: '/api/v1/health/live',
    tags: ['Health'],
    summary: 'Liveness probe',
    description: 'Uygulamanın canlı olup olmadığını kontrol eder',
    responses: {
        200: {
            description: 'Uygulama canlı',
            content: {
                'application/json': {
                    schema: z.object({
                        status: z.string().openapi({ example: 'alive' }),
                        timestamp: z.string().datetime(),
                    }),
                },
            },
        },
        503: { description: 'Uygulama yanıt vermiyor' },
    },
});

registry.registerPath({
    method: 'get',
    path: '/api/v1/health/ready',
    tags: ['Health'],
    summary: 'Readiness probe',
    description: 'Uygulamanın trafiği kabul etmeye hazır olup olmadığını kontrol eder',
    responses: {
        200: {
            description: 'Uygulama hazır ve trafik kabul edebilir',
            content: {
                'application/json': {
                    schema: z.object({
                        status: z.string().openapi({ example: 'ready' }),
                        timestamp: z.string().datetime(),
                        database: z.object({
                            status: z.string().openapi({ example: 'connected' }),
                        }),
                    }),
                },
            },
        },
        503: {
            description: 'Uygulama hazır değil',
            content: {
                'application/json': {
                    schema: z.object({
                        status: z.string().openapi({ example: 'not ready' }),
                        error: z.string(),
                    }),
                },
            },
        },
    },
});

module.exports = {};
