{ pkgs }: {
  deps = [
    pkgs.python311
    pkgs.python311Packages.pip
    pkgs.nodejs-18_x
    pkgs.nodePackages.typescript
    pkgs.yarn
  ];
} 