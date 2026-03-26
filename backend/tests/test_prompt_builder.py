from app.services.prompt_builder import build_prompt


def test_room_and_furniture_images():
    result = build_prompt(
        style="北欧",
        furniture_descriptions=["原木茶几"],
        has_room_image=True,
        furniture_image_count=2,
    )
    assert "图1" in result
    assert "图2" in result
    assert "图3" in result
    assert "北欧" in result
    assert "原木茶几" in result
    assert "建筑结构" in result


def test_room_image_only():
    result = build_prompt(
        style="中式",
        furniture_descriptions=["书架"],
        has_room_image=True,
        furniture_image_count=0,
    )
    assert "图1" in result
    assert "中式" in result
    assert "书架" in result


def test_no_images():
    result = build_prompt(
        style="日式",
        furniture_descriptions=[],
        has_room_image=False,
        furniture_image_count=0,
    )
    assert "日式" in result
    assert "室内装修效果图" in result


def test_custom_prompt():
    result = build_prompt(
        style="现代简约",
        furniture_descriptions=[],
        has_room_image=True,
        furniture_image_count=0,
        custom_prompt="增加暖色灯光",
    )
    assert "增加暖色灯光" in result


def test_single_furniture_image():
    result = build_prompt(
        style="北欧",
        furniture_descriptions=[],
        has_room_image=True,
        furniture_image_count=1,
    )
    assert "图2" in result
    assert "图3" not in result
