{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    pkg-config
    gobject-introspection
    cargo
    rustc
    cowsay
    bun
    azure-functions-core-tools
    azure-cli
    at-spi2-atk
    atkmm
    cairo
    gdk-pixbuf
    glib
    glib-networking
    gtk3
    harfbuzz
    librsvg
    libsoup_3
    pango
    webkitgtk_4_1
    openssl
    gsettings-desktop-schemas # <-- added this so gtk knows how to draw windows
    nodejs_20
  ];

  GREETING = "DEV MODE ON";

  shellHook = ''
    echo $GREETING | cowsay

    # fix the svgs (white boxes)
    export GDK_PIXBUF_MODULE_FILE=$(echo ${pkgs.librsvg}/lib/gdk-pixbuf-2.0/*/loaders.cache)

    # fix the themes/fonts (ugly ui)
    export XDG_DATA_DIRS=${pkgs.gsettings-desktop-schemas}/share/gsettings-schemas/${pkgs.gsettings-desktop-schemas.name}:${pkgs.gtk3}/share/gsettings-schemas/${pkgs.gtk3.name}:$XDG_DATA_DIRS
    
    # fix network images (glib-networking)
    export GIO_MODULE_DIR="${pkgs.glib-networking}/lib/gio/modules/";
    # aliases
    alias fdev="cd frontend && bun tauri dev"
    alias bdev="cd backend && bun run build && func start"
  '';
}
