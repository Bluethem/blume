require "test_helper"

class Api::V1::MedicoNotificacionesControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get api_v1_medico_notificaciones_index_url
    assert_response :success
  end

  test "should get marcar_todas_leidas" do
    get api_v1_medico_notificaciones_marcar_todas_leidas_url
    assert_response :success
  end

  test "should get marcar_leida" do
    get api_v1_medico_notificaciones_marcar_leida_url
    assert_response :success
  end

  test "should get marcar_no_leida" do
    get api_v1_medico_notificaciones_marcar_no_leida_url
    assert_response :success
  end

  test "should get destroy" do
    get api_v1_medico_notificaciones_destroy_url
    assert_response :success
  end
end
