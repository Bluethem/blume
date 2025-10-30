require "test_helper"

class Api::V1::MedicoPacientesControllerTest < ActionDispatch::IntegrationTest
  test "should get buscar" do
    get api_v1_medico_pacientes_buscar_url
    assert_response :success
  end

  test "should get index" do
    get api_v1_medico_pacientes_index_url
    assert_response :success
  end

  test "should get show" do
    get api_v1_medico_pacientes_show_url
    assert_response :success
  end

  test "should get create" do
    get api_v1_medico_pacientes_create_url
    assert_response :success
  end
end
