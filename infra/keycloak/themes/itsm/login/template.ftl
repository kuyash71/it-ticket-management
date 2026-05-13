<#import "field.ftl" as field>
<#import "footer.ftl" as loginFooter>
<#macro username>
  <#assign label>
    <#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>
  </#assign>
  <@field.group name="username" label=label>
    <div class="${properties.kcInputGroup}">
      <div class="${properties.kcInputGroupItemClass} ${properties.kcFill}">
        <span class="${properties.kcInputClass} ${properties.kcFormReadOnlyClass}">
          <input id="kc-attempted-username" value="${auth.attemptedUsername}" readonly>
        </span>
      </div>
      <div class="${properties.kcInputGroupItemClass}">
        <button id="reset-login" class="${properties.kcFormPasswordVisibilityButtonClass} kc-login-tooltip" type="button"
              aria-label="${msg('restartLoginTooltip')}" onclick="location.href='${url.loginRestartFlowUrl}'">
            <i class="fa-sync-alt fas" aria-hidden="true"></i>
            <span class="kc-tooltip-text">${msg("restartLoginTooltip")}</span>
        </button>
      </div>
    </@field.group>
</#macro>

<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html class="${properties.kcHtmlClass!}"<#if realm.internationalizationEnabled> lang="${locale.currentLanguageTag}" dir="${(locale.rtl)?then('rtl','ltr')}"</#if>>

<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">

    <#if properties.meta?has_content>
        <#list properties.meta?split(' ') as meta>
            <meta name="${meta?split('==')[0]}" content="${meta?split('==')[1]}"/>
        </#list>
    </#if>
    <title>${msg("loginTitle",(realm.displayName!''))}</title>
    <link rel="icon" href="${url.resourcesPath}/img/favicon.ico" />
    <#if properties.stylesCommon?has_content>
        <#list properties.stylesCommon?split(' ') as style>
            <link href="${url.resourcesCommonPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <script type="importmap">
        {
            "imports": {
                "rfc4648": "${url.resourcesCommonPath}/vendor/rfc4648/rfc4648.js"
            }
        }
    </script>
    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script src="${url.resourcesPath}/${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <#if scripts??>
        <#list scripts as script>
            <script src="${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <script type="module" src="${url.resourcesPath}/js/passwordVisibility.js"></script>
    <script type="module">
        import { startSessionPolling } from "${url.resourcesPath}/js/authChecker.js";
        startSessionPolling("${url.ssoLoginInOtherTabsUrl?no_esc}");
    </script>
</head>

<body class="itsm-body ${properties.kcBodyClass!}">

<div class="itsm-split">
  <!-- ── Left: Brand / marketing panel ────────────────────────── -->
  <aside class="itsm-brand-panel" aria-hidden="true">
    <div class="itsm-brand-panel__glow"></div>
    <div class="itsm-brand-panel__inner">
      <div class="itsm-brand-mark">
        <svg viewBox="0 0 32 32" width="36" height="36" aria-hidden="true">
          <rect x="0.5" y="0.5" width="31" height="31" rx="8" fill="#6366f1"/>
          <path d="M9.5 13.5 16 19.5l6.5-6" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <circle cx="16" cy="11.5" r="1.6" fill="white"/>
        </svg>
        <span class="itsm-brand-mark__name">ITSM</span>
      </div>

      <div class="itsm-brand-panel__hero">
        <h2 class="itsm-brand-panel__heading">
          Resolve incidents.<br/>
          <span class="itsm-brand-panel__heading-accent">Ship service faster.</span>
        </h2>
        <p class="itsm-brand-panel__lead">
          A modern IT service desk for incident, request, change and problem management — designed for teams who care about velocity and SLAs.
        </p>

        <ul class="itsm-feature-list">
          <li>
            <span class="itsm-feature-list__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            <div>
              <strong>SLA-aware tickets</strong>
              <span>Real-time clocks, breach alerts, business-hour calendars.</span>
            </div>
          </li>
          <li>
            <span class="itsm-feature-list__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            <div>
              <strong>Workflow automation</strong>
              <span>BPMN-driven incident and service request lifecycles.</span>
            </div>
          </li>
          <li>
            <span class="itsm-feature-list__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            <div>
              <strong>Observability built-in</strong>
              <span>Structured logs, traces, and dashboards out of the box.</span>
            </div>
          </li>
        </ul>
      </div>

      <footer class="itsm-brand-panel__footer">
        <span>© 2026 ITSM Platform</span>
        <span class="itsm-brand-panel__dot">·</span>
        <span>Secured by Keycloak</span>
      </footer>
    </div>
  </aside>

  <!-- ── Right: Form panel ────────────────────────────────────── -->
  <main class="itsm-form-panel">
    <div class="itsm-form-panel__inner">

      <!-- Mobile-only compact brand -->
      <div class="itsm-mobile-brand">
        <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
          <rect x="0.5" y="0.5" width="31" height="31" rx="8" fill="#6366f1"/>
          <path d="M9.5 13.5 16 19.5l6.5-6" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <circle cx="16" cy="11.5" r="1.6" fill="white"/>
        </svg>
        <span>ITSM</span>
      </div>

      <div class="itsm-form-card">
        <header class="itsm-form-card__header">
          <h1 id="kc-page-title" class="itsm-form-card__title"><#nested "header"></h1>
          <p class="itsm-form-card__subtitle">Please sign in to continue to your workspace.</p>

          <#if realm.internationalizationEnabled && locale.supported?size gt 1>
            <div class="itsm-locale">
              <label for="login-select-toggle" class="itsm-locale__label">${msg("languages")}</label>
              <div class="itsm-locale__select-wrap">
                <select
                  aria-label="${msg("languages")}"
                  id="login-select-toggle"
                  class="itsm-locale__select"
                  onchange="if (this.value) window.location.href=this.value">
                  <#list locale.supported?sort_by("label") as l>
                    <option value="${l.url}" ${(l.languageTag == locale.currentLanguageTag)?then('selected','')}>${l.label}</option>
                  </#list>
                </select>
                <svg class="itsm-locale__chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          </#if>
        </header>

        <div class="itsm-form-card__body">
          <#if !(auth?has_content && auth.showUsername() && !auth.showResetCredentials())>
              <#if displayRequiredFields>
                  <div class="${properties.kcContentWrapperClass!}">
                      <div class="${properties.kcLabelWrapperClass!} subtitle">
                          <span class="${properties.kcInputHelperTextItemTextClass!}">
                            <span class="${properties.kcInputRequiredClass!}">*</span> ${msg("requiredFields")}
                          </span>
                      </div>
                  </div>
              </#if>
          <#else>
              <#if displayRequiredFields>
                  <div class="${properties.kcContentWrapperClass!}">
                      <div class="${properties.kcLabelWrapperClass!} subtitle">
                          <span class="${properties.kcInputHelperTextItemTextClass!}">
                            <span class="${properties.kcInputRequiredClass!}">*</span> ${msg("requiredFields")}
                          </span>
                      </div>
                      <div class="${properties.kcFormClass} ${properties.kcContentWrapperClass}">
                          <#nested "show-username">
                          <@username />
                      </div>
                  </div>
              <#else>
                  <div class="${properties.kcFormClass} ${properties.kcContentWrapperClass}">
                    <#nested "show-username">
                    <@username />
                  </div>
              </#if>
          </#if>

          <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
              <div class="itsm-alert itsm-alert--${message.type}" role="alert">
                  <span class="itsm-alert__icon" aria-hidden="true">
                    <#if message.type = 'success'><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></#if>
                    <#if message.type = 'warning' || message.type = 'error'><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></#if>
                    <#if message.type = 'info'><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></#if>
                  </span>
                  <span class="itsm-alert__text">${kcSanitize(message.summary)?no_esc}</span>
              </div>
          </#if>

          <#nested "form">

          <#if auth?has_content && auth.showTryAnotherWayLink()>
            <form id="kc-select-try-another-way-form" action="${url.loginAction}" method="post" novalidate="novalidate">
                <input type="hidden" name="tryAnotherWay" value="on"/>
                <a id="try-another-way" href="javascript:document.forms['kc-select-try-another-way-form'].requestSubmit()"
                   class="itsm-link-secondary">
                  ${kcSanitize(msg("doTryAnotherWay"))?no_esc}
                </a>
            </form>
          </#if>

          <#if displayInfo>
            <div class="itsm-form-card__info">
                <#nested "info">
            </div>
          </#if>
        </div>

        <#nested "socialProviders">
      </div>

      <p class="itsm-form-panel__footnote">
        Need help? Contact <a href="mailto:support@itsm.local">support@itsm.local</a>
      </p>
    </div>
  </main>
</div>

</body>
</html>
</#macro>
