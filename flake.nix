{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
  flake-utils.lib.eachDefaultSystem (system:
    let
      # pkgs = import nixpkgs {
      #   inherit system;
      # };
              pkgs = nixpkgs.legacyPackages.${system};


      trash-cal = pkgs.buildNpmPackage rec {
        name = "trash-cal";
        version = "0.1.0";

        src = ./.;

        outputHashAlgo = "sha256";
        outputHashMode = "recursive";
        npmDepsHash = "sha256-YuUs7LYx2bdMvHpSBxasP6dw0iFH4gn29b7hK61WvLE=";
      };
    in
    {
      devShell = pkgs.mkShell {
        buildInputs = [
          pkgs.nodejs
          pkgs.git
        ];
      };

      packages = {
        default = pkgs.writeScript "trash-cal.sh" ''
          #!${pkgs.bash}/bin/sh
          export PATH=$PATH:${pkgs.bash}/bin
          (cd ${trash-cal}/lib/node_modules/trash-cal/ && ${pkgs.nodejs_24}/bin/npm start)
        '';
      };
    }
  );
}