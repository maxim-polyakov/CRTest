import React from 'react';
import '../../styles.css';

export const ItemRow = React.memo(({ item, isSelected, onSelect }) => (
    <tr
        key={item.id}
        data-id={item.id}
        className={isSelected ? 'selected' : ''}
    >
        <td className="checkbox-cell">
            <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(item.id)}
            />
        </td>
        <td>{item.id}</td>
        <td>{item.name}</td>
        <td>{item.description}</td>
        <td>{item.value}</td>
        <td className="custom-order-cell">
            {/* Можно добавить индикатор кастомного порядка */}
            <span className="order-indicator" title="Порядок в кастомной сортировке">
                ⭐
            </span>
        </td>
        <td>
            <span className="drag-handle" title="Перетащите для изменения порядка">
                ☰
            </span>
        </td>
    </tr>
));