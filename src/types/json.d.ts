declare module "*.asset.json" {
  const value: { url: string; original_filename: string; content_type: string };
  export default value;
}
declare module "*.json" {
  const value: any;
  export default value;
}
