package cl.gesex.app;

import android.app.Dialog;
import android.os.Bundle;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginHandle;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.lang.reflect.Field;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ImmersivePlugin.class);
        super.onCreate(savedInstanceState);
    }

    /** Oculta barra de estado y navegacion; reaparecen temporalmente al deslizar. */
    static void hideSystemBars(Window window) {
        if (window == null) return;
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }

    /** Pantalla completa real para la ventana del navegador in-app (RDWeb / Extranet). */
    @CapacitorPlugin(name = "GesexImmersive")
    public static class ImmersivePlugin extends Plugin {

        @PluginMethod
        public void apply(PluginCall call) {
            getActivity().runOnUiThread(() -> {
                boolean applied = false;
                PluginHandle handle = getBridge().getPlugin("InAppBrowser");
                Object browser = handle != null ? handle.getInstance() : null;
                if (browser != null) {
                    for (Field field : browser.getClass().getDeclaredFields()) {
                        if (!Dialog.class.isAssignableFrom(field.getType())) continue;
                        try {
                            field.setAccessible(true);
                            Dialog dialog = (Dialog) field.get(browser);
                            if (dialog != null && dialog.isShowing()) {
                                hideSystemBars(dialog.getWindow());
                                applied = true;
                            }
                        } catch (Exception ignored) {}
                    }
                }
                JSObject result = new JSObject();
                result.put("applied", applied);
                call.resolve(result);
            });
        }
    }
}
