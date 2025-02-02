import Trouter from 'trouter';
import {RouteBuilder, RouteHolder} from './route-holder.mjs';
import {
    HttpEvent,
    HttpHeadersWithContentType,
    HttpMethod,
    HttpRequest,
    HttpResponse,
    HttpStatusCode,
    MimeType
} from './http-event.mjs';
import {AttachmentRegistry, Nornir, Result} from '@nornir/core';
import {NornirRestRequestError} from "./error.mjs";

type RouteHandler = (request: Result<HttpRequest>, registry: AttachmentRegistry) => Promise<Result<HttpResponse>>;

export class Router {
    private static DEFAULT_INSTANCE_ID = 'default';
    private static readonly instanceMap = new Map<string, Router>();

    /** @internal */
    public static get(apiId?: string): Router {
        const instance = Router.instanceMap.get(apiId || Router.DEFAULT_INSTANCE_ID);
        if (instance == undefined) {
            const newInstance = new Router();
            Router.instanceMap.set(apiId || Router.DEFAULT_INSTANCE_ID, newInstance);
            return newInstance;
        }
        return instance;
    }

    private readonly router = new Trouter<RouteHandler>();
    private readonly routeHolders: RouteHolder[] = [];
    private readonly routes: { method: HttpMethod, path: string, builder: RouteBuilder }[] = []

    /**
     * @internal
     */
    public register(route: RouteHolder) {
        this.routeHolders.push(route);
    }

    /**
     * Create a Nornir REST instance.
     * The result can be used directly as a Nornir handler.
     */
    public static build(apiId = Router.DEFAULT_INSTANCE_ID): (request: HttpEvent, registry: AttachmentRegistry) => Promise<HttpResponse> {
        return Router.get(apiId).build();
    }

    /** @internal */
    public build(): (request: HttpEvent, registry: AttachmentRegistry) => Promise<HttpResponse> {
        for (const routeHolder of this.routeHolders) {
            this.routes.push(...routeHolder.routes);
        }
        for (const {
            method,
            path,
            builder
        } of this.routes) {
            this.router.add(method, path, builder(new Nornir<HttpRequest>()).buildWithContext())
        }


        return async (event, registry): Promise<HttpResponse> => {
            // eslint-disable-next-line unicorn/no-array-method-this-argument, unicorn/no-array-callback-reference
            const {params, handlers: [handler]} = this.router.find(event.method, event.path);
            const request: HttpRequest = {
                ...event,
                headers: {
                    "content-type": "" as never,
                    ...event.headers,
                } as HttpHeadersWithContentType,
                pathParams: params,
            }
            if (handler == undefined) {
                throw new NornirRouteNotFoundError(request);
            }
            const response = await handler(Result.ok(request), registry);
            return response.unwrap();
        }
    }
}

export class NornirRouteNotFoundError extends NornirRestRequestError<HttpRequest> {
    constructor(
        request: HttpRequest,
    ) {
        super(request, `Route not found`)
    }

    toHttpResponse(): HttpResponse {
        return {
            statusCode: HttpStatusCode.NotFound,
            body: "Not Found",
            headers: {
                "content-type": MimeType.TextPlain
            },
        }
    }
}
