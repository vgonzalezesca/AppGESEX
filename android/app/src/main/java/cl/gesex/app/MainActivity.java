package cl.gesex.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends BridgeActivity {

    private static final int FILE_CHOOSER_REQUEST = 51426;

    // JS inyectado solo en la sesion RDWeb: si tras reanudar (bloqueo/segundo plano)
    // el propio dialogo "Intentando conectar de nuevo" de RDWeb queda atascado,
    // recarga esa sesion en vez de dejarla en bucle. Misma logica que gesex-resume-guard.js
    // usada en la PWA original, adaptada a un WebView persistente.
    private static final String RESUME_GUARD_JS = """
        (function () {
          if (window.__gesexResumeGuard) return;
          window.__gesexResumeGuard = true;
          var GRACE_MS = 8000, WATCH_MS = 120000, LOOP_GUARD_MS = 45000;
          var LOST = /intentando conectar de nuevo|se perdi[oó] la conexi[oó]n|no pudimos establecer una conexi[oó]n|attempting to reconnect|trying to reconnect|connection (was )?lost|couldn'?t connect/i;
          var watchUntil = 0, lostSince = 0, timer = 0, lastReload = 0;
          function dialogText() {
            var nodes = document.querySelectorAll('[role="dialog"],[role="alertdialog"],.ms-Dialog,.ms-Modal,.ms-Layer');
            var text = '';
            for (var i = 0; i < nodes.length; i++) text += ' ' + (nodes[i].textContent || '');
            return text;
          }
          function reload() {
            if (Date.now() - lastReload < LOOP_GUARD_MS) return;
            lastReload = Date.now();
            window.location.reload();
          }
          function check() {
            if (document.visibilityState !== 'visible') return;
            if (Date.now() > watchUntil) { clearInterval(timer); timer = 0; return; }
            if (!navigator.onLine) { lostSince = 0; return; }
            if (LOST.test(dialogText())) {
              if (!lostSince) lostSince = Date.now();
              if (Date.now() - lostSince >= GRACE_MS) reload();
            } else {
              lostSince = 0;
            }
          }
          document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'visible') {
              watchUntil = Date.now() + WATCH_MS;
              lostSince = 0;
              if (!timer) timer = setInterval(check, 2000);
              check();
            }
          });
        })();
        """;

    private FrameLayout overlay;
    private final Map<String, WebView> sessions = new HashMap<>();
    private String activeKey = null;
    private boolean homeArmed = false;
    private long homeArmedAt = 0;
    private ValueCallback<Uri[]> filePathCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(SessionsPlugin.class);
        super.onCreate(savedInstanceState);
        buildOverlay();
    }

    @Override
    public void onBackPressed() {
        if (activeKey != null) {
            hideSession();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST) {
            Uri[] results = null;
            if (filePathCallback != null && resultCode == Activity.RESULT_OK && data != null) {
                if (data.getClipData() != null) {
                    int count = data.getClipData().getItemCount();
                    results = new Uri[count];
                    for (int i = 0; i < count; i++) results[i] = data.getClipData().getItemAt(i).getUri();
                } else if (data.getData() != null) {
                    results = new Uri[]{ data.getData() };
                }
            }
            if (filePathCallback != null) {
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    private void buildOverlay() {
        overlay = new FrameLayout(this);
        overlay.setBackgroundColor(Color.BLACK);
        overlay.setVisibility(View.GONE);
        getWindow().addContentView(
            overlay,
            new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        );
        overlay.addView(buildHomeButton());
    }

    private View buildHomeButton() {
        TextView button = new TextView(this);
        button.setText("⌂");
        button.setTextColor(Color.WHITE);
        button.setTextSize(20);
        button.setGravity(Gravity.CENTER);
        button.setBackgroundColor(0x8808284D);
        int size = (int) (52 * getResources().getDisplayMetrics().density);
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(size, size);
        params.gravity = Gravity.START | Gravity.CENTER_VERTICAL;
        button.setLayoutParams(params);
        button.setOnClickListener(v -> {
            long now = System.currentTimeMillis();
            if (homeArmed && now - homeArmedAt < 3000) {
                homeArmed = false;
                hideSession();
            } else {
                homeArmed = true;
                homeArmedAt = now;
                Toast.makeText(this, "Toca otra vez para volver al inicio", Toast.LENGTH_SHORT).show();
            }
        });
        return button;
    }

    /** Crea el WebView de la sesion la primera vez; luego lo reutiliza tal cual, sin recargar. */
    private WebView getOrCreateSession(String key) {
        WebView view = sessions.get(key);
        if (view != null) return view;
        view = new WebView(this);
        view.setLayoutParams(new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT
        ));
        view.getSettings().setJavaScriptEnabled(true);
        view.getSettings().setDomStorageEnabled(true);
        view.getSettings().setDatabaseEnabled(true);
        view.getSettings().setMediaPlaybackRequiresUserGesture(false);
        boolean isRdweb = "rdweb".equals(key);
        view.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView webView, String url) {
                if (isRdweb) webView.evaluateJavascript(RESUME_GUARD_JS, null);
            }
        });
        view.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> callback, FileChooserParams params) {
                filePathCallback = callback;
                try {
                    startActivityForResult(params.createIntent(), FILE_CHOOSER_REQUEST);
                } catch (Exception e) {
                    filePathCallback = null;
                    return false;
                }
                return true;
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> request.grant(request.getResources()));
            }
        });
        overlay.addView(view, 0);
        sessions.put(key, view);
        return view;
    }

    void showSession(String key, String url) {
        WebView view = getOrCreateSession(key);
        for (Map.Entry<String, WebView> entry : sessions.entrySet()) {
            entry.getValue().setVisibility(entry.getKey().equals(key) ? View.VISIBLE : View.GONE);
        }
        if (view.getUrl() == null) {
            view.loadUrl(url);
        }
        activeKey = key;
        overlay.setVisibility(View.VISIBLE);
        overlay.bringToFront();
        hideSystemBars(getWindow());
    }

    void hideSession() {
        overlay.setVisibility(View.GONE);
        activeKey = null;
        showSystemBars(getWindow());
    }

    static void hideSystemBars(Window window) {
        if (window == null) return;
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }

    static void showSystemBars(Window window) {
        if (window == null) return;
        WindowCompat.getInsetsController(window, window.getDecorView()).show(WindowInsetsCompat.Type.systemBars());
    }

    /** Abre/oculta las sesiones persistentes de RDWeb y Extranet sin destruirlas al cambiar entre ellas. */
    @CapacitorPlugin(name = "GesexSessions")
    public static class SessionsPlugin extends Plugin {

        @PluginMethod
        public void open(PluginCall call) {
            String key = call.getString("key");
            String url = call.getString("url");
            if (key == null || url == null) {
                call.reject("key y url son requeridos");
                return;
            }
            MainActivity activity = (MainActivity) getActivity();
            activity.runOnUiThread(() -> activity.showSession(key, url));
            call.resolve();
        }

        @PluginMethod
        public void hide(PluginCall call) {
            MainActivity activity = (MainActivity) getActivity();
            activity.runOnUiThread(activity::hideSession);
            call.resolve();
        }
    }
}
