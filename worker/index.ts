import { WorkerEntrypoint } from "cloudflare:workers"
import vinextHandler from "vinext/server/fetch-handler"
import { buildWwwToApexRedirect } from "@/lib/www-redirect"

/** Props partition apex HTML in Workers Cache (host is not in the default URL key). */
export interface CedearsCacheProps {
  cachePartition: "apex"
}

export class CachedVinext extends WorkerEntrypoint<Env, CedearsCacheProps> {
  fetch(request: Request): Response | Promise<Response> {
    return vinextHandler.fetch(request, this.env, this.ctx as ExecutionContext)
  }
}

/**
 * Gateway: www is redirected before any Workers Cache lookup on the vinext app.
 * Apex traffic uses a named, cacheable entrypoint so hot cache never skips this
 * redirect for www or serves a www-only response on apex.
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext & {
      exports: {
        CachedVinext: {
          fetch(request: Request, init?: { props?: CedearsCacheProps }): Promise<Response>
        }
      }
    },
  ): Promise<Response> {
    const redirect = buildWwwToApexRedirect(request)
    if (redirect) return redirect

    return ctx.exports.CachedVinext.fetch(request, {
      props: { cachePartition: "apex" },
    })
  },
}
