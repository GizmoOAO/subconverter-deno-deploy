export interface Profile {
  key_env: string;
  target:
    | "clash"
    | "clashr"
    | "quan"
    | "quanx"
    | "loon"
    | "mellow"
    | "ss"
    | "sssub"
    | "ssd"
    | "ssr"
    | "surfboard"
    | "surge&ver=2"
    | "surge&ver=3"
    | "surge&ver=4"
    | "trojan"
    | "v2ray"
    | "mixed"
    | "auto";
  nodes: string[];
  emoji?: boolean;
  udp?: boolean;
  tfo?: boolean;
  exclude?: string[];
}

export interface ProfileData {
  key_env: string;
  data: string;
}
