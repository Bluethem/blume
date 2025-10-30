require "test_helper"

class Api::V1::MedicoCitasControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get api_v1_medico_citas_index_url
    assert_response :success
  end

  test "should get show" do
    get api_v1_medico_citas_show_url
    assert_response :success
  end

  test "should get create" do
    get api_v1_medico_citas_create_url
    assert_response :success
  end

  test "should get completar" do
    get api_v1_medico_citas_completar_url
    assert_response :success
  end

  test "should get cancelar" do
    get api_v1_medico_citas_cancelar_url
    assert_response :success
  end
end
