interface ColorChipProps {
  color: string;
  size?: number;
  className?: string;
}

export function ColorChip({ color, size = 14, className = '' }: ColorChipProps) {
  return (
    <span
      className={`inline-block border border-gray-300 rounded-sm ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        marginRight: '4px',
        marginBottom: '2px',
        verticalAlign: 'middle'
      }}
      title={color}
    />
  );
}

interface ColorChipsProps {
  colors: string[];
  size?: number;
  maxColors?: number;
  className?: string;
}

export function ColorChips({ colors, size = 14, maxColors = 5, className = '' }: ColorChipsProps) {
  const displayColors = colors.slice(0, maxColors);
  
  return (
    <span className={`inline-flex items-center ${className}`}>
      {displayColors.map((color, index) => (
        <ColorChip 
          key={index} 
          color={color} 
          size={size}
        />
      ))}
    </span>
  );
}