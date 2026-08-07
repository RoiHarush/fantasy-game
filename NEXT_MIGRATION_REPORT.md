# דו״ח השלמת מיגרציית Next.js

תאריך אימות: 6 באוגוסט 2026.

## 1. מצב התחלתי

העבודה החלה מעץ העבודה הקיים, ללא reset, stash, checkout, commit או החלפת branch. בתחילת העבודה היו 51 קבצים ששונו ושני קבצים חדשים ב־frontend. לא היו שינויים ב־backend. `npm run lint` עבר, וגם `npm run build` עבר ב־Next.js 15.5.22 והפיק 21 routes, אך עדיין היו כשלים שלא נלכדו ב־build: routes רגילים מחוץ ל־`app/(site)`, קוד Vite/React Router ישן, rewrite ל־`/index.html`, `Link to`, proxy המבוסס על משתנים ציבוריים, `/api/auth/me` חסר וקריאות API גולמיות.

## 2. מה כבר היה קיים

- App Router בסיסי עם routes ציבוריים, routes רגילים ו־layout נפרד ל־super admin.
- תשתית ESLint עבור Next וחריגה מכוונת ל־`@next/next/no-img-element`.
- `src/services/apiClient.js` ו־`src/Utils/routing.js` במצב חלקי.
- רפקטור חלקי של auth, guards, contexts ושירותי REST.
- מימוש WebSocket המבוסס על `@stomp/stompjs` ו־`sockjs-client`.
- production build תקין בנקודת הזמן הקודמת.

## 3. בעיות שנמצאו ותוקנו

- `PreDraftStatus` השתמש ב־`<Link to>` במקום `href`.
- routes רגילים לא היו תחת `(site)`, ולכן לא קיבלו Header, navigation ו־Footer.
- נשארו `App.jsx`, `main.jsx`, `BrowserRouter`, Vite וקובץ Vercel SPA.
- `next.config.js` השתמש ב־`NEXT_PUBLIC_API_URL`/`VITE_API_URL` במקום `BACKEND_URL` שרתי.
- שלושה מסכי super-admin עדיין השתמשו ב־`fetch` גולמי.
- `/api/auth/me` לא היה קיים; Spring גם החזיר 403 במקום 401 לבקשה לא מאומתת.
- session bootstrap עדיין קרא cached user לפני האימות הסמכותי.
- Login ו־AuthContext ביצעו redirects מתחרים.
- עדכון Settings הפעיל מחדש את פעולת login וגרם ל־redirect מיותר.
- onboarding ניתב החוצה מיד אחרי יצירת ליגה, לפני הצגת קוד ההזמנה.
- Scout ביקש squad למשתמש ללא ליגה ונשאר בטעינה כשלא היה gameweek.
- Draft Room ביקש squad לפני פתיחת draft והפיק 500 מיותר.
- חוזה `subscribe`/`unsubscribe` לא היה אחיד; subscription יחיד לכל topic דרס callbacks אחרים.
- reconnect לא היה תלוי ישירות בשינוי token.
- timers של system status לא נוקו באופן מלא.
- מספר modals יצרו portal ישירות אל `document.body` בזמן render.
- ברירות המחדל של CORS/WebSocket עדיין כיוונו ל־5173.
- `npm audit` מצא בתחילה 10 advisories: moderate אחד, שמונה high ו־critical אחד.

## 4. קבצים שנמחקו

- `frontend/index.html`
- `frontend/vite.config.js`
- `frontend/vercel.json`
- `frontend/src/App.jsx`
- `frontend/src/main.jsx`
- `frontend/src/Test.jsx`
- `frontend/src/config.js`

קובצי route ישנים תחת `frontend/app/<route>` הועברו, ולא נמחקו פונקציונלית, אל `frontend/app/(site)/<route>`.

## 5. קבצים שנוצרו

- `frontend/src/services/apiClient.js` — כבר היה חדש בעץ העבודה ונשמר והושלם.
- `frontend/src/Utils/routing.js` — כבר היה חדש בעץ העבודה ונשמר והושלם.
- routes תחת `frontend/app/(site)/` עבור כל מסכי האתר הרגילים.
- `backend/src/test/java/com/fantasy/domain/auth/AuthControllerCurrentUserTest.java`.
- `NEXT_MIGRATION_REPORT.md`.

## 6. קבצים מרכזיים ששונו

- Frontend: `app/layout.jsx`, `app/(site)/layout.jsx`, `next.config.js`, `.env.example`, `package.json`, `package-lock.json`.
- Auth/routing: `AuthContext.jsx`, `RouteGuards.jsx`, `Login.jsx`, `LeagueOnboardingPage.jsx`, `routing.js`.
- API: `apiClient.js`, כל קובצי `src/services`, contexts ורכיבי super-admin שנותרו עם `fetch`.
- Scout/gameweeks: `ScoutPage.jsx`, `GameweeksContext.jsx`.
- WebSocket: `WebSocketProvider.jsx`, `SystemStatusContext.jsx`, `DraftRoomPage.jsx`, `TransferWindow.jsx`.
- Hydration/portals: `Portal.jsx` וארבעת ה־modals של IR/first-pick.
- Backend: `AuthController.java`, `AuthService.java`, `SecurityConfig.java`, `WebSocketConfig.java`, `application.properties`.

לא שונו חוקי scoring, draft, waiver, IR או transfer.

## 7. מבנה routes סופי

מחוץ ל־site group: `/`, `/login`, `/admin`, `/admin/users`, `/admin/actions`, `/admin/leagues`, ו־not-found.

תחת `app/(site)`, ללא שינוי URL ציבורי: `/onboarding`, `/scout`, `/status`, `/league`, `/points`, `/points/[userId]`, `/pick-team`, `/fixtures`, `/transfer-window`, `/draft-room`, `/waivers`, `/settings`, `/league-control`.

אין routes כפולים. ה־build הסופי הפיק 21 routes.

## 8. Authentication ושחזור session

- בהרכבת הלקוח נקרא רק token השייך לאפליקציה.
- ללא token, auth loading מסתיים והמשתמש נשאר null.
- עם token, `GET /api/auth/me` טוען `UserDto` סמכותי. cached `loggedUser` אינו מוצג לפני התשובה.
- 401 מנקה רק `token` ו־`loggedUser`, מציג הודעת session קצרה ומנתב ל־`/login`.
- login/register שומרים token ומשתמש ומנתבים במקום מרכזי: super admin אל `/admin`, משתמש ללא ליגה אל `/onboarding`, ומשתמש עם ליגה אל `/status`.
- יצירה/הצטרפות לליגה מרעננות מיד את המשתמש דרך `/api/auth/me`.
- league admin נשאר `ROLE_USER` עם `leagueAdmin=true`; אין ערבוב עם `ROLE_SUPER_ADMIN`.

## 9. API proxy

הדפדפן משתמש רק בנתיבים יחסיים. `BACKEND_URL` נצרך בשרת Next בלבד. ה־rewrites הם:

- `/api/:path*` אל `${BACKEND_URL}/api/:path*`
- `/ws` אל `${BACKEND_URL}/ws`
- `/ws/:path*` אל `${BACKEND_URL}/ws/:path*`

נבדק בפועל: `/api/auth/me` דרך port 3000 החזיר 401 JSON של Spring, login הגיע ל־Spring, ו־`/ws/info` החזיר 200 JSON של SockJS. לא הוצג HTML של Next כשגיאת API.

## 10. WebSocket ו־reconnect

- `new Client`, `webSocketFactory: () => new SockJS("/ws")`, connect header עם Bearer token, `activate`, `deactivate` ו־`publish`.
- חיבור קיים רק כאשר יש user ו־token.
- שינוי user/token יוצר חיבור חדש; logout מנתק.
- topic מחזיק Set של callbacks אך subscription יחיד ל־broker, ולכן אין subscription כפול לאותו topic.
- cleanup מוחזר ישירות מ־`subscribe` ונעשה אחיד בכל callers.
- reconnect delay של 5 שניות, heartbeat דו־כיווני ו־resubscribe לכל desired topics.
- גוף הודעה פגום נתפס ולא מפיל את האפליקציה.
- נבדק בפועל: connect, עצירת Spring, חזרת Spring וחיבור חדש ללא refresh, ו־disconnect ב־logout.

לא נשלח event עסקי אחרי reconnect, ולכן חידוש delivery וללא duplicate delivery לא אומתו באמצעות event אמיתי; רק החיבור מחדש והמימוש נבדקו.

## 11. שינויי backend ולמה

- `GET /api/auth/me`: endpoint מאומת, ללא userId בבקשה, המשתמש נגזר מ־`@AuthenticationPrincipal` ומוחזר כ־`UserDto` הקיים.
- `/api/auth/me` הוצא מ־permit-all; רק POST login/register/logout ציבוריים.
- authentication entry point מחזיר 401 עקבי, כדי שהלקוח יוכל לזהות token פג.
- ברירות מחדל של CORS ושל WebSocket עודכנו ל־localhost:3000 והן נשארו ניתנות להגדרה באמצעות environment.
- נוספו בדיקות ל־unauthenticated, normal user, league admin ו־super admin ברמת endpoint/controller.

## 12. פקודות עיקריות שהורצו

- `git status --short`, `git diff --stat`, `git diff -- frontend`, `git diff -- backend`.
- חיפושי `rg` לכל React Router, Vite, raw fetch, STOMP ישן, browser-only APIs ו־`/index.html`.
- `npm run lint` ו־`npm run build` לפני ואחרי השינויים.
- `npm uninstall react-router-dom vite @vitejs/plugin-react eslint-plugin-react-refresh`.
- `npm audit`, `npm audit fix`, `npm audit --omit=dev --json`.
- `gradlew.bat test --console=plain --no-daemon`.
- `gradlew.bat bootJar --console=plain --no-daemon`.
- הפעלת Spring Boot ו־Next dev לצורך בדיקות browser, וכן בדיקות HTTP ל־proxy.
- `git ls-files frontend/.next`.

## 13. תוצאת lint

פקודה סופית: `npm run lint`.

תוצאה מדויקת: exit code 0, ללא errors וללא warnings, עם `eslint . --max-warnings=0`.

## 14. תוצאת build

פקודה סופית: `npm run build`.

תוצאה: הצלחה מלאה ב־Next.js 15.5.23 לאחר `npm audit fix`; compilation, type/lint check, page data ו־21/21 static pages עברו. הופקו 21 routes. ניסיון build אחד בזמן `next dev` נכשל עקב התנגשות משותפת על `.next`; שרת dev נעצר, `.next` הגנרטיבי הוסר, וה־build הנקי עבר.

## 15. בדיקות backend

`gradlew test`: `BUILD SUCCESSFUL in 1m 16s`; ארבע tasks, אחת executed ושלוש up-to-date.

`gradlew bootJar`: `BUILD SUCCESSFUL in 29s`; נוצר artifact אריזה תקין.

## 16. flows שנבדקו בפועל

- `/` ו־`/status` ללא login ניתבו ל־`/login` ללא loop.
- login שגוי הציג `User not found` ולא HTML.
- הרשמה יצרה token וניתבה משתמש ללא ליגה ל־onboarding.
- refresh שחזר session דרך `/api/auth/me`.
- Scout למשתמש ללא ליגה טען 561 שחקנים, לא הציג squad והציג CTA.
- route ליגתי למשתמש ללא ליגה ניתב ל־onboarding.
- יצירת ליגה רעננה session, סימנה את היוצר כ־league admin והציגה קוד הזמנה.
- league-control היה זמין ליוצר.
- משתמש שני נרשם והצטרף באמצעות קוד; לא הוצג לו league-control וגישה ישירה נשללה.
- status טרום־draft וה־Next Link אל Draft Room עבדו; direct navigation אל `/draft-room` עבד.
- active-only route `/points` ניתב ל־status עבור ליגה שעדיין ממתינה ל־draft.
- login תקין ולאחריו refresh שמרו את `/status`.
- WebSocket connect, reconnect אחרי restart ו־disconnect ב־logout.
- proxy REST ו־SockJS נבדקו דרך port 3000.

נוצרו ב־H2 המקומי נתוני E2E: שלושה משתמשי בדיקה ושתי ליגות בשם `Codex Migration League` ו־`Codex Invite Verification`. הם לא נמחקו אוטומטית כדי לא לבצע מחיקה לא מורשית של נתוני המשתמש.

## 17. flows שלא נבדקו

- super-admin בפועל, משום שלא סופקו credentials.
- מעבר ליגה ל־ACTIVE, draft אמיתי, picks ו־event עסקי אחרי reconnect.
- Points, fixtures, pick-team ו־settings במצב ליגה פעילה.
- IR modals ופעולות IR מול backend.
- חלון transfer ידני, failed transfer ויציבות UI.
- שמירה/טעינה של waiver plan ו־waiver automation בפועל.
- system-status LOCKED/UNLOCKED event אמיתי.
- יצירת מצב שבו אין כלל gameweek במסד.
- delivery כפול/יחיד של event אמיתי אחרי reconnect.
- Vercel ושרת Spring ציבוריים בפועל.

## 18. סיכונים ו־blockers שנותרו

- `npm audit --omit=dev` מדווח על 3 high advisories תחת Next 15: Next, PostCSS ו־sharp. `npm audit fix` הסיר את ה־critical ואת שאר הבעיות; התיקון המוצע לנותרות הוא Next 16.3.0, שינוי major שלא הוחל אוטומטית.
- flows עסקיים קריטיים של ליגה פעילה, draft, IR, transfer ו־waiver לא נבדקו E2E בגלל היעדר נתוני ליגה פעילה/credentials מתאימים.
- בזמן restart צפויות שגיאות REST זמניות מה־polling; ה־UI התאושש וה־WebSocket התחבר מחדש.
- Vercel preview origins אינם מותרים אוטומטית ב־REST CORS. לפריסה עם preview domains יש להגדיר origins מדויקים או לבצע שינוי CORS נפרד ומבוקר.

## 19. environment לפיתוח מקומי

Frontend:

```env
BACKEND_URL=http://localhost:8080
```

Backend defaults כבר מאפשרים `http://localhost:3000`. אפשר לדרוס באמצעות `CORS_ALLOWED_ORIGINS` ו־`WEBSOCKET_ALLOWED_ORIGIN_PATTERNS`.

## 20. environment לפריסה

ב־Vercel: `BACKEND_URL=https://<spring-host>`.

בשרת Spring, בנוסף למשתני DB/JWT הקיימים:

```env
CORS_ALLOWED_ORIGINS=https://<frontend-host>
WEBSOCKET_ALLOWED_ORIGIN_PATTERNS=https://<frontend-host>
JWT_SECRET=<secret-production>
DATABASE_URL=<postgres-url>
DATABASE_USER=<postgres-user>
DATABASE_PASSWORD=<postgres-password>
SPRING_PROFILE=prod
```

אין לחשוף את `BACKEND_URL` כ־`NEXT_PUBLIC_*`, ואין לשמור secrets בריפו.

## 21. הוראות הרצה מקומית

1. ב־`backend`: `gradlew.bat bootRun --console=plain --no-daemon`.
2. ב־`frontend`: להגדיר `BACKEND_URL=http://localhost:8080` ולהריץ `npm run dev`.
3. לפתוח `http://localhost:3000`.
4. לפני מסירה: `npm run lint`, `npm run build`, וב־backend `gradlew.bat test`.

## 22. הוראות פריסה

Vercel: Root Directory הוא `frontend`, framework הוא Next.js, build command הוא `npm run build`, ולהגדיר `BACKEND_URL` ל־URL הציבורי של Spring. אין צורך ב־`vercel.json` של SPA.

Spring: לבנות עם `gradlew.bat bootJar`, לפרוס את `backend/build/libs/app.jar`, להגדיר Java 21 ואת משתני production לעיל, לוודא HTTPS, health endpoint ו־WebSocket/SockJS ב־`/ws`, ולהוסיף את origin המדויק של Vercel ל־CORS ול־WebSocket.

## מסקנת מוכנות

המיגרציה עצמה קומפלטיבית מבחינת מבנה App Router, build, auth/session, proxy ו־WebSocket בסיסי. היא מועמדת לביקורת קוד, אך אינה מוכנה למיזוג סופי או לפריסה production ללא החלטה מפורשת לגבי שדרוג Next 16.3/האזהרות שנותרו וללא השלמת בדיקות E2E ל־draft, IR, transfer, waivers, active league ו־super admin.
