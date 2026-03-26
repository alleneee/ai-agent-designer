def build_prompt(
    style: str,
    furniture_descriptions: list[str],
    has_room_image: bool,
    furniture_image_count: int,
    custom_prompt: str | None = None,
) -> str:
    parts: list[str] = []

    if has_room_image and furniture_image_count > 0:
        parts.append("基于图1中的真实房间进行室内装修设计")
        parts.append(
            "保持图1中房间的墙壁、地板、天花板、门窗、灯具等建筑结构和空间布局完全不变"
        )
        refs = "、".join(f"图{i + 2}" for i in range(furniture_image_count))
        parts.append(
            f"将{refs}中的家具放入房间中，家具的款式、颜色、材质、造型必须与参考图中一致"
        )
        if furniture_descriptions:
            parts.append(f"同时添加以下家具：{'、'.join(furniture_descriptions)}")
        parts.append(f"整体装修风格为{style}，家具摆放位置合理，空间布局协调")
    elif has_room_image:
        parts.append(f"基于图1中的真实房间进行{style}风格的室内装修设计")
        parts.append("保持图1中房间的墙壁、地板、天花板、门窗等建筑结构完全不变")
        if furniture_descriptions:
            parts.append(f"在房间中添加以下家具：{'、'.join(furniture_descriptions)}")
        else:
            parts.append(f"在房间中添加{style}风格的家具和装饰")
        parts.append("家具摆放位置合理，空间布局协调")
    else:
        parts.append(f"生成一间{style}风格的室内装修效果图")
        if furniture_descriptions:
            parts.append(f"房间中包含以下家具：{'、'.join(furniture_descriptions)}")

    parts.append("专业室内设计效果图，高清写实风格，自然光照，8K质感")

    if custom_prompt:
        parts.append(custom_prompt)

    return "。".join(parts)
