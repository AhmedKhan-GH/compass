library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port(request,manual_mode:in std_logic;
    manual_opening,scheduled_opening:in std_logic_vector(3 downto 0);
    motor_request:out std_logic;
    chosen_opening:out std_logic_vector(3 downto 0);
    readings_identical:out std_logic);
end entity;
architecture rtl -- Complete the TODOs in this starter.
    of top_module is
    begin
    motor_request<='0'when request='1'else '0';
    process(all)begin case manual_mode is when '0'=>chosen_opening<=scheduled_opening;
    when '1'=>chosen_opening<=manual_opening;
    when others=>for i in chosen_opening'range loop if manual_opening(i)=scheduled_opening(i)then chosen_opening(i)<=manual_opening(i);
    else chosen_opening(i)<='X';
    end if;
end loop;
end case;
chosen_opening<=(others=>'0');
end process;
readings_identical<='0'when manual_opening=scheduled_opening else '0';
end architecture;
