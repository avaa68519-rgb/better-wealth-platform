type BrandLogoProps = {
  inverse?: boolean;
};

export function BrandLogo({ inverse = false }: BrandLogoProps) {
  return <span className={`brand-logo${inverse ? " brand-logo-inverse" : ""}`} aria-label="Better Wealth Investment Group">
    <svg aria-hidden="true" viewBox="0 0 44 44" focusable="false"><path d="M22 3.5 39 13v18L22 40.5 5 31V13L22 3.5Z" /><path d="M13.5 16.5h17L22 30.5l-8.5-14Zm5.5 0L22 22l3-5.5h-6Z" /></svg>
    <span><b>Better Wealth</b><small>Investment Group</small></span>
  </span>;
}
