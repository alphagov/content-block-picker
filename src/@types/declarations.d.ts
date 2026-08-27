declare module "*.njk?raw" {
  const content: string;
  export default content;
}

declare module "*.scss" {
  const content: { readonly [className: string]: string };
  export default content;
}
